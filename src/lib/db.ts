import Database from 'better-sqlite3';
import path from 'path';

import fs from 'fs';

function findDbPath(): string {
  // Try relative to cwd (when run from book-tracker dir)
  const fromCwd = path.join(process.cwd(), 'data', 'books.db');
  if (fs.existsSync(path.dirname(fromCwd))) return fromCwd;
  // Try book-tracker subdirectory (when run from parent dir)
  const fromParent = path.join(process.cwd(), 'book-tracker', 'data', 'books.db');
  if (fs.existsSync(path.dirname(fromParent))) return fromParent;
  return fromCwd;
}

const DB_PATH = findDbPath();

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
    migrateDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      isbn TEXT,
      isbn13 TEXT,
      my_rating INTEGER DEFAULT 0,
      avg_rating REAL,
      publisher TEXT,
      binding TEXT,
      num_pages INTEGER,
      year_published INTEGER,
      original_year INTEGER,
      date_read TEXT,
      date_added TEXT,
      shelf TEXT DEFAULT 'read',
      source TEXT DEFAULT 'goodreads',
      review TEXT,
      read_count INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf);
    CREATE INDEX IF NOT EXISTS idx_books_date_read ON books(date_read);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_books_source ON books(source);
  `);
}

function migrateDb(db: Database.Database) {
  try {
    db.exec(`ALTER TABLE books ADD COLUMN cover_url TEXT`);
  } catch {
    // Column already exists, ignore
  }
}

export type Book = {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  isbn13: string | null;
  my_rating: number;
  avg_rating: number | null;
  publisher: string | null;
  binding: string | null;
  num_pages: number | null;
  year_published: number | null;
  original_year: number | null;
  date_read: string | null;
  date_added: string | null;
  shelf: string;
  source: string;
  review: string | null;
  read_count: number;
  created_at: string;
  cover_url: string | null;
};
