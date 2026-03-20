import type { Database } from "better-sqlite3";
import {
  getRunningTaskCountByRepo,
  getNextQueuedTask,
  updateTaskStatus,
} from "../db/tasks.js";
import type { TaskRunner } from "./taskRunner.js";

const DEFAULT_MAX_CONCURRENT = 2;

export class TaskQueue {
  private readonly maxConcurrent: number;

  constructor(
    private readonly taskRunner: TaskRunner,
    maxConcurrent?: number
  ) {
    this.maxConcurrent = maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
  }

  async enqueue(
    db: Database,
    taskId: string,
    repo: string,
    branch: string,
    taskFilePath: string
  ): Promise<void> {
    const runningCount = getRunningTaskCountByRepo(db, repo);

    if (runningCount >= this.maxConcurrent) {
      updateTaskStatus(db, taskId, "queued");
      return;
    }

    await this.taskRunner.executeTask(db, taskId, repo, branch, taskFilePath);
    await this.processNext(db, repo);
  }

  async processNext(db: Database, repo: string): Promise<void> {
    const runningCount = getRunningTaskCountByRepo(db, repo);
    if (runningCount >= this.maxConcurrent) {
      return;
    }

    const nextTask = getNextQueuedTask(db, repo);
    if (!nextTask) {
      return;
    }

    await this.taskRunner.executeTask(
      db,
      nextTask.id,
      nextTask.repo,
      nextTask.branch,
      nextTask.task_file_path
    );

    await this.processNext(db, repo);
  }
}
