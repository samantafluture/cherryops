import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { initializeDatabase } from "../db/schema.js";
import {
  insertTask,
  getTaskById,
  updateTaskStatus,
  getTasksByRepo,
  getRunningTaskCountByRepo,
  getNextQueuedTask,
  getTaskByFilePath,
} from "../db/tasks.js";

describe("Task Database Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    initializeDatabase(db);
  });

  afterEach(() => {
    db.close();
  });

  const sampleTask = {
    id: "01JTASK001",
    repo: "user/repo",
    branch: "main",
    task_file_path: "pending/task-001.md",
    status: "queued" as const,
    type: "adhoc" as const,
    skill_id: null,
    agent_mode: "api_direct" as const,
    output_file: null,
    created_at: new Date().toISOString(),
  };

  it("inserts and retrieves a task", () => {
    insertTask(db, sampleTask);
    const task = getTaskById(db, sampleTask.id);
    expect(task).toBeDefined();
    expect(task!.id).toBe(sampleTask.id);
    expect(task!.repo).toBe(sampleTask.repo);
    expect(task!.status).toBe("queued");
  });

  it("returns undefined for non-existent task", () => {
    const task = getTaskById(db, "nonexistent");
    expect(task).toBeUndefined();
  });

  it("updates task status", () => {
    insertTask(db, sampleTask);
    updateTaskStatus(db, sampleTask.id, "running", {
      started_at: new Date().toISOString(),
    });

    const task = getTaskById(db, sampleTask.id);
    expect(task!.status).toBe("running");
    expect(task!.started_at).toBeTruthy();
  });

  it("updates task with error details", () => {
    insertTask(db, sampleTask);
    updateTaskStatus(db, sampleTask.id, "error", {
      completed_at: new Date().toISOString(),
      error: "Something went wrong",
    });

    const task = getTaskById(db, sampleTask.id);
    expect(task!.status).toBe("error");
    expect(task!.error).toBe("Something went wrong");
  });

  it("lists tasks by repo", () => {
    insertTask(db, sampleTask);
    insertTask(db, { ...sampleTask, id: "01JTASK002", task_file_path: "pending/task-002.md" });
    insertTask(db, { ...sampleTask, id: "01JTASK003", repo: "other/repo", task_file_path: "pending/task-003.md" });

    const tasks = getTasksByRepo(db, "user/repo");
    expect(tasks).toHaveLength(2);
  });

  it("counts running tasks by repo", () => {
    insertTask(db, sampleTask);
    insertTask(db, { ...sampleTask, id: "01JTASK002", status: "running" as const, task_file_path: "pending/task-002.md" });
    insertTask(db, { ...sampleTask, id: "01JTASK003", status: "running" as const, task_file_path: "pending/task-003.md" });

    const count = getRunningTaskCountByRepo(db, "user/repo");
    expect(count).toBe(2);
  });

  it("gets next queued task by creation order", () => {
    insertTask(db, { ...sampleTask, id: "01JTASK003", created_at: "2026-01-03T00:00:00Z", task_file_path: "pending/task-003.md" });
    insertTask(db, { ...sampleTask, id: "01JTASK001", created_at: "2026-01-01T00:00:00Z", task_file_path: "pending/task-001.md" });
    insertTask(db, { ...sampleTask, id: "01JTASK002", created_at: "2026-01-02T00:00:00Z", task_file_path: "pending/task-002.md" });

    const next = getNextQueuedTask(db, "user/repo");
    expect(next).toBeDefined();
    expect(next!.id).toBe("01JTASK001");
  });

  it("finds task by file path", () => {
    insertTask(db, sampleTask);
    const task = getTaskByFilePath(db, "pending/task-001.md");
    expect(task).toBeDefined();
    expect(task!.id).toBe(sampleTask.id);
  });

  it("returns undefined for non-existent file path", () => {
    const task = getTaskByFilePath(db, "pending/nonexistent.md");
    expect(task).toBeUndefined();
  });
});
