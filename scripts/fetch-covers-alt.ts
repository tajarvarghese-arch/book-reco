import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function findDbPath(): string {
  const fromCwd = path.join(process.cwd(), 'data', 'books.db');
  if (fs.existsSync(path.dirname(fromCwd))) return fromCwd;
  const fromParent = path.join(process.cwd(), 'book-tracker', 'data', 'books.db');
  if (fs.existsSync(path.dirname(fromParent))) return fromParent;
  return fromCwd;
}

const DB_PATH = findDbPath();
console.log(`Using database: ${DB_PATH}`);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

type BookRow = {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  isbn13: string | null;
};

const books = db.prepare(
  `SELECT id, title, author, isbn, isbn13 FROM books WHERE cover_url = 'none'`
).all() as BookRow[];

console.log(`Found ${books.length} books with cover_url = 'none' to retry`);

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Remove parenthetical info: "Smiley's People (The Karla Trilogy, #3)" -> "Smiley's People" */
function removeParens(title: string): string {
  return title.replace(/\s*\(.*?\)\s*/g, '').trim();
}

/** Remove subtitle after colon: "Blood Meridian: Or the Evening..." -> "Blood Meridian" */
function removeSubtitle(title: string): string {
  const idx = title.indexOf(':');
  if (idx > 0) return title.substring(0, idx).trim();
  return title;
}

/** Get first N words of a title */
function firstWords(title: string, n: number): string {
  return title.split(/\s+/).slice(0, n).join(' ');
}

async function searchOpenLibrary(query: Record<string, string>): Promise<number | null> {
  const params = new URLSearchParams({ ...query, limit: '1', fields: 'cover_i' });
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    if (res.ok) {
      const data = await res.json();
      const coverId = data?.docs?.[0]?.cover_i;
      if (coverId) return coverId;
    }
  } catch { /* ignore */ }
  return null;
}

async function fetchCoverForBook(book: BookRow): Promise<string | null> {
  const hasParens = /\(.*?\)/.test(book.title);
  const cleanTitle = removeParens(book.title);
  const hasSubtitle = cleanTitle.includes(':');
  const wordCount = cleanTitle.split(/\s+/).length;

  // Strategy 1: Search by clean title (without parenthetical info)
  let coverId = await searchOpenLibrary({ title: cleanTitle });
  if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  await delay(500);

  // Strategy 2: Search by ISBN if available
  const isbn = book.isbn || book.isbn13;
  if (isbn) {
    coverId = await searchOpenLibrary({ isbn });
    if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    await delay(500);
  }

  // Strategy 3: If title had parenthetical info, the clean title was already tried.
  // Now try without subtitle too if there's a colon.
  if (hasSubtitle) {
    const shortTitle = removeSubtitle(cleanTitle);
    coverId = await searchOpenLibrary({ title: shortTitle });
    if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    await delay(500);
  }

  // Strategy 4: Try with just the first few words if title is long (5+ words)
  if (wordCount >= 5) {
    const shortTitle = firstWords(cleanTitle, 3);
    coverId = await searchOpenLibrary({ title: shortTitle, author: book.author || '' });
    if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    await delay(500);
  }

  return null;
}

const updateStmt = db.prepare(`UPDATE books SET cover_url = ? WHERE id = ?`);

async function main() {
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const coverUrl = await fetchCoverForBook(book);

    if (coverUrl) {
      updateStmt.run(coverUrl, book.id);
      found++;
      console.log(`[${i + 1}/${books.length}] FOUND cover for: ${book.title}`);
    } else {
      notFound++;
      console.log(`[${i + 1}/${books.length}] No cover: ${book.title}`);
    }

    // Rate limit between books (the per-strategy delays are inside fetchCoverForBook)
    await delay(500);
  }

  console.log(`\nDone! Found covers: ${found}, Still missing: ${notFound}`);
  db.close();
}

main().catch((err) => {
  console.error('Error:', err);
  db.close();
  process.exit(1);
});
