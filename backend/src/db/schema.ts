import Database from "better-sqlite3";

const TASKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    repo TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'main',
    task_file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL DEFAULT 'adhoc',
    skill_id TEXT,
    agent_mode TEXT NOT NULL DEFAULT 'api_direct',
    output_file TEXT,
    error TEXT,
    commit_sha TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
  )
`;

const DEVICES_TABLE = `
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    fcm_token TEXT NOT NULL,
    device_id TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL DEFAULT 'android',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

const TASKS_STATUS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)
`;

const TASKS_REPO_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_tasks_repo ON tasks (repo)
`;

export function initializeDatabase(db: Database.Database): void {
  db.exec(TASKS_TABLE);
  db.exec(DEVICES_TABLE);
  db.exec(TASKS_STATUS_INDEX);
  db.exec(TASKS_REPO_INDEX);
}
