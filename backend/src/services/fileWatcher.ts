import { watch, type FSWatcher } from "node:fs";
import path from "node:path";
import type { Database } from "better-sqlite3";
import type { TaskQueue } from "./taskQueue.js";
interface WatchedRepo {
  repo: string;
  branch: string;
  localPath: string;
  watcher: FSWatcher;
}

export class FileWatcher {
  private readonly watchers: Map<string, WatchedRepo> = new Map();

  constructor(
    private readonly taskQueue: TaskQueue,
    private readonly db: Database
  ) {}

  watchRepo(repo: string, branch: string, localPath: string): void {
    if (this.watchers.has(repo)) {
      return;
    }

    const pendingDir = path.join(localPath, "pending");

    const watcher = watch(pendingDir, { recursive: false }, (eventType, filename) => {
      if (eventType === "rename" && filename?.endsWith(".md")) {
        void this.handleNewTaskFile(repo, branch, `pending/${filename}`);
      }
    });

    this.watchers.set(repo, { repo, branch, localPath, watcher });
  }

  unwatchRepo(repo: string): void {
    const watched = this.watchers.get(repo);
    if (watched) {
      watched.watcher.close();
      this.watchers.delete(repo);
    }
  }

  unwatchAll(): void {
    for (const [repo] of this.watchers) {
      this.unwatchRepo(repo);
    }
  }

  private async handleNewTaskFile(
    repo: string,
    branch: string,
    taskFilePath: string
  ): Promise<void> {
    const taskId = path.basename(taskFilePath, ".md");

    try {
      await this.taskQueue.enqueue(
        this.db,
        taskId,
        repo,
        branch,
        taskFilePath
      );
    } catch (error) {
      console.error(`Error processing task file ${taskFilePath}:`, error);
    }
  }
}
