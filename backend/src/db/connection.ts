import Database from "better-sqlite3";
import path from "node:path";
import { initializeDatabase } from "./schema.js";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath =
      process.env["NODE_ENV"] === "test"
        ? ":memory:"
        : path.resolve("data", "cherryops.db");

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDatabase(db);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
