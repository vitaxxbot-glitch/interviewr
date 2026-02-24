import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'db.sqlite');
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      goal TEXT NOT NULL,
      instructions TEXT NOT NULL,
      max_questions INTEGER NOT NULL DEFAULT 8,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL REFERENCES interviews(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL DEFAULT (unixepoch()),
      completed_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  // Safe migrations for existing DBs
  try { db.exec(`ALTER TABLE interviews ADD COLUMN max_questions INTEGER NOT NULL DEFAULT 8`); } catch {}
  try { db.exec(`ALTER TABLE interviews ADD COLUMN summary TEXT`); } catch {}
  try { db.exec(`ALTER TABLE interviews ADD COLUMN intro_message TEXT NOT NULL DEFAULT ''`); } catch {}
  try { db.exec(`ALTER TABLE interviews ADD COLUMN success_message TEXT NOT NULL DEFAULT ''`); } catch {}
  try { db.exec(`ALTER TABLE interviews ADD COLUMN fields TEXT NOT NULL DEFAULT '["name","email"]'`); } catch {}
  try { db.exec(`ALTER TABLE sessions ADD COLUMN phone TEXT NOT NULL DEFAULT ''`); } catch {}
}

export function saveSummary(id: string, summary: string) {
  getDb().prepare(`UPDATE interviews SET summary = ? WHERE id = ?`).run(summary, id);
}

export function updateInterview(id: string, fields: {
  title?: string; goal?: string; intro_message?: string;
  success_message?: string; fields?: string; max_questions?: number;
}) {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (fields.title !== undefined) { sets.push('title = ?'); vals.push(fields.title); }
  if (fields.goal !== undefined) { sets.push('goal = ?'); vals.push(fields.goal); }
  if (fields.intro_message !== undefined) { sets.push('intro_message = ?'); vals.push(fields.intro_message); }
  if (fields.success_message !== undefined) { sets.push('success_message = ?'); vals.push(fields.success_message); }
  if (fields.fields !== undefined) { sets.push('fields = ?'); vals.push(fields.fields); }
  if (fields.max_questions !== undefined) { sets.push('max_questions = ?'); vals.push(fields.max_questions); }
  if (sets.length === 0) return;
  vals.push(id);
  getDb().prepare(`UPDATE interviews SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

// --- Interviews ---
export function createInterview(id: string, title: string, goal: string, instructions: string, maxQuestions: number) {
  getDb().prepare(`INSERT INTO interviews (id, title, goal, instructions, max_questions) VALUES (?, ?, ?, ?, ?)`)
    .run(id, title, goal, instructions, maxQuestions);
}

export function getInterview(id: string) {
  return getDb().prepare(`SELECT * FROM interviews WHERE id = ?`).get(id) as
    { id: string; title: string; goal: string; instructions: string; max_questions: number; summary: string | null; created_at: number } | undefined;
}

export function listInterviews() {
  return getDb().prepare(`SELECT * FROM interviews ORDER BY created_at DESC`).all() as
    { id: string; title: string; goal: string; instructions: string; max_questions: number; created_at: number }[];
}

// --- Sessions ---
export function createSession(id: string, interviewId: string, name: string, email: string, phone = '') {
  getDb().prepare(`INSERT INTO sessions (id, interview_id, name, email, phone) VALUES (?, ?, ?, ?, ?)`)
    .run(id, interviewId, name, email, phone);
}

export function getSession(id: string) {
  return getDb().prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
    { id: string; interview_id: string; name: string; email: string; completed: number; started_at: number; completed_at: number | null } | undefined;
}

export function completeSession(id: string) {
  getDb().prepare(`UPDATE sessions SET completed = 1, completed_at = unixepoch() WHERE id = ?`).run(id);
}

export function getSessionsForInterview(interviewId: string) {
  return getDb().prepare(`
    SELECT s.*, COUNT(m.id) as message_count
    FROM sessions s
    LEFT JOIN messages m ON m.session_id = s.id AND m.role = 'user'
    WHERE s.interview_id = ?
    GROUP BY s.id ORDER BY s.started_at DESC
  `).all(interviewId) as any[];
}

// --- Messages ---
export function addMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  getDb().prepare(`INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`).run(sessionId, role, content);
}

export function getMessages(sessionId: string) {
  return getDb().prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`).all(sessionId) as
    { id: number; session_id: string; role: 'user' | 'assistant'; content: string; created_at: number }[];
}

export function getAllSessionMessages(interviewId: string) {
  return getDb().prepare(`
    SELECT s.name, s.email, m.role, m.content, m.created_at
    FROM messages m JOIN sessions s ON s.id = m.session_id
    WHERE s.interview_id = ? ORDER BY s.id, m.created_at ASC
  `).all(interviewId) as { name: string; email: string; role: string; content: string; created_at: number }[];
}
