import type { Database } from "better-sqlite3";

export function initializeDatabase(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      graph       TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS executions (
      id           TEXT PRIMARY KEY,
      workflow_id  TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      status       TEXT NOT NULL DEFAULT 'PENDING',
      input        TEXT NOT NULL DEFAULT '{}',
      output       TEXT,
      logs         TEXT NOT NULL DEFAULT '[]',
      started_at   TEXT,
      finished_at  TEXT,
      error        TEXT
    );
  `);
}
