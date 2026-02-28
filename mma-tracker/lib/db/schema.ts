import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "fightmate.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        level TEXT NOT NULL,
        points REAL NOT NULL DEFAULT 0,
        diversity_bonus REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS group_members (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        username TEXT,
        score REAL NOT NULL DEFAULT 0,
        badges TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS shoutbox_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'user',
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sparring_sessions (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        opponent_id TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_shoutbox_created ON shoutbox_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_sparring_users ON sparring_sessions(challenger_id, opponent_id);
    `);
  }
  return _db;
}
