import type { Database } from "better-sqlite3";
import { getDatabase } from "../db/connection.js";
import { getTaskByFilePath } from "../db/tasks.js";
import type { RepoManager } from "./repoManager.js";
import type { TaskQueue } from "./taskQueue.js";
import { ulid } from "ulid";

interface WatchedRepo {
  repo: string;
  branch: string;
}

/**
 * Polls GitHub repos for new task files in the pending/ directory.
 * When a new .md file appears, it auto-dispatches it through the task queue.
 */
export class RepoPollWatcher {
  private readonly watchedRepos: WatchedRepo[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly knownFiles = new Map<string, Set<string>>();

  constructor(
    private readonly repoManager: RepoManager,
    private readonly taskQueue: TaskQueue,
    private readonly pollIntervalMs: number = 30_000
  ) {}

  addRepo(repo: string, branch: string = "main"): void {
    if (!this.watchedRepos.some((r) => r.repo === repo && r.branch === branch)) {
      this.watchedRepos.push({ repo, branch });
    }
  }

  removeRepo(repo: string): void {
    const index = this.watchedRepos.findIndex((r) => r.repo === repo);
    if (index !== -1) {
      this.watchedRepos.splice(index, 1);
      this.knownFiles.delete(repo);
    }
  }

  start(): void {
    if (this.intervalId) return;

    console.log(
      `[RepoPollWatcher] Starting — polling ${this.watchedRepos.length} repos every ${this.pollIntervalMs / 1000}s`
    );

    // Initial poll
    void this.pollAll();

    this.intervalId = setInterval(() => {
      void this.pollAll();
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[RepoPollWatcher] Stopped");
    }
  }

  private async pollAll(): Promise<void> {
    for (const { repo, branch } of this.watchedRepos) {
      try {
        await this.pollRepo(repo, branch);
      } catch (error) {
        console.error(`[RepoPollWatcher] Error polling ${repo}:`, error);
      }
    }
  }

  private async pollRepo(repo: string, branch: string): Promise<void> {
    const tree = await this.repoManager.getFileTree(repo, branch);

    const pendingFiles = tree
      .filter(
        (entry) =>
          entry.type === "blob" &&
          entry.path.startsWith("pending/") &&
          entry.path.endsWith(".md")
      )
      .map((entry) => entry.path);

    const knownSet = this.knownFiles.get(repo) ?? new Set<string>();

    // First run — seed known files without dispatching
    if (!this.knownFiles.has(repo)) {
      this.knownFiles.set(repo, new Set(pendingFiles));
      return;
    }

    const db = getDatabase();

    for (const filePath of pendingFiles) {
      if (knownSet.has(filePath)) continue;

      // Check if we already have a task for this file
      const existing = getTaskByFilePath(db, filePath);
      if (existing) {
        knownSet.add(filePath);
        continue;
      }

      console.log(`[RepoPollWatcher] New task file detected: ${repo}/${filePath}`);

      const taskId = ulid();
      await this.taskQueue.enqueue(db, taskId, repo, branch, filePath);
      knownSet.add(filePath);
    }

    // Remove files that no longer exist in pending/
    for (const known of knownSet) {
      if (!pendingFiles.includes(known)) {
        knownSet.delete(known);
      }
    }

    this.knownFiles.set(repo, knownSet);
  }
}
