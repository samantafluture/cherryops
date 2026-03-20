import type { Database } from "better-sqlite3";
import type { TaskRecord, TaskStatus } from "../types.js";

export function insertTask(
  db: Database,
  task: Omit<TaskRecord, "started_at" | "completed_at" | "commit_sha" | "error">
): void {
  const stmt = db.prepare(`
    INSERT INTO tasks (id, repo, branch, task_file_path, status, type, skill_id, agent_mode, output_file, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    task.id,
    task.repo,
    task.branch,
    task.task_file_path,
    task.status,
    task.type,
    task.skill_id,
    task.agent_mode,
    task.output_file,
    task.created_at
  );
}

export function getTaskById(
  db: Database,
  taskId: string
): TaskRecord | undefined {
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  return stmt.get(taskId) as TaskRecord | undefined;
}

export function updateTaskStatus(
  db: Database,
  taskId: string,
  status: TaskStatus,
  extra?: {
    started_at?: string;
    completed_at?: string;
    error?: string;
    commit_sha?: string;
    output_file?: string;
  }
): void {
  const fields = ["status = ?"];
  const values: (string | null)[] = [status];

  if (extra?.started_at) {
    fields.push("started_at = ?");
    values.push(extra.started_at);
  }
  if (extra?.completed_at) {
    fields.push("completed_at = ?");
    values.push(extra.completed_at);
  }
  if (extra?.error !== undefined) {
    fields.push("error = ?");
    values.push(extra.error);
  }
  if (extra?.commit_sha) {
    fields.push("commit_sha = ?");
    values.push(extra.commit_sha);
  }
  if (extra?.output_file) {
    fields.push("output_file = ?");
    values.push(extra.output_file);
  }

  values.push(taskId);
  const stmt = db.prepare(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`
  );
  stmt.run(...values);
}

export function getTasksByRepo(
  db: Database,
  repo: string
): TaskRecord[] {
  const stmt = db.prepare("SELECT * FROM tasks WHERE repo = ? ORDER BY created_at DESC");
  return stmt.all(repo) as TaskRecord[];
}

export function getRunningTaskCountByRepo(
  db: Database,
  repo: string
): number {
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE repo = ? AND status = 'running'"
  );
  const result = stmt.get(repo) as { count: number };
  return result.count;
}

export function getTaskByFilePath(
  db: Database,
  filePath: string
): TaskRecord | undefined {
  const stmt = db.prepare("SELECT * FROM tasks WHERE task_file_path = ? LIMIT 1");
  return stmt.get(filePath) as TaskRecord | undefined;
}

export function getFailedTasks(
  db: Database
): TaskRecord[] {
  const stmt = db.prepare(
    "SELECT * FROM tasks WHERE status = 'error' ORDER BY completed_at DESC"
  );
  return stmt.all() as TaskRecord[];
}

export function getNextQueuedTask(
  db: Database,
  repo: string
): TaskRecord | undefined {
  const stmt = db.prepare(
    "SELECT * FROM tasks WHERE repo = ? AND status = 'queued' ORDER BY created_at ASC LIMIT 1"
  );
  return stmt.get(repo) as TaskRecord | undefined;
}
