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

// Ensure cover_url column exists
try {
  db.exec(`ALTER TABLE books ADD COLUMN cover_url TEXT`);
  console.log('Added cover_url column');
} catch {
  // Column already exists
}

type BookRow = {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  isbn13: string | null;
};

const books = db.prepare(
  `SELECT id, title, author, isbn, isbn13 FROM books WHERE cover_url IS NULL`
).all() as BookRow[];

console.log(`Found ${books.length} books without covers`);

function cleanIsbn(raw: string | null): string | null {
  if (!raw) return null;
  // Remove ="..." wrapper from Goodreads export
  const cleaned = raw.replace(/^="?/, '').replace(/"?$/, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCoverForBook(book: BookRow): Promise<string | null> {
  // Strategy 1: Open Library ISBN cover (direct URL, no API call needed)
  const isbn13 = cleanIsbn(book.isbn13);
  const isbn = cleanIsbn(book.isbn);
  const isbnToUse = isbn13 || isbn;
  if (isbnToUse) {
    // Just construct the URL - Open Library will serve the image
    const url = `https://covers.openlibrary.org/b/isbn/${isbnToUse}-M.jpg`;
    // Verify it's a real cover (not a 1x1 placeholder)
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) {
        const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
        if (contentLength > 500) {
          return url;
        }
      }
    } catch { /* ignore */ }
  }

  // Strategy 2: Open Library search API by title+author
  if (book.title) {
    const titleClean = book.title.replace(/\(.*?\)/g, '').trim();
    const params = new URLSearchParams({
      title: titleClean,
      limit: '1',
      fields: 'cover_i',
    });
    if (book.author) params.set('author', book.author);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?${params}`);
      if (res.ok) {
        const data = await res.json();
        const coverId = data?.docs?.[0]?.cover_i;
        if (coverId) {
          return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
        }
      }
    } catch { /* ignore */ }
  }

  return null;
}

const updateStmt = db.prepare(`UPDATE books SET cover_url = ? WHERE id = ?`);

async function main() {
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const coverUrl = await fetchCoverForBook(book);

    if (coverUrl) {
      updateStmt.run(coverUrl, book.id);
      console.log(`Fetched cover for ${book.title} [${i + 1}/${books.length}]`);
    } else {
      updateStmt.run('none', book.id);
      console.log(`No cover found for ${book.title} [${i + 1}/${books.length}]`);
    }

    await delay(200);
  }

  console.log('Done!');
  db.close();
}

main().catch((err) => {
  console.error('Error:', err);
  db.close();
  process.exit(1);
});
