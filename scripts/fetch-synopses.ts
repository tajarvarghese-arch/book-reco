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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanTitle(title: string): string {
  // Remove parenthetical info like "(Series Name, #1)"
  return title.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function extractDescription(desc: unknown): string | null {
  if (!desc) return null;
  if (typeof desc === 'string') return desc;
  if (typeof desc === 'object' && desc !== null && 'value' in desc) {
    return (desc as { value: string }).value;
  }
  return null;
}

function cleanSynopsis(text: string): string {
  // Clean up newlines, collapse whitespace, trim to 500 chars
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + '...';
  }
  return cleaned;
}

async function fetchJSON(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function fetchByISBN(isbn: string): Promise<string | null> {
  try {
    const isbnData = await fetchJSON(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!isbnData?.works?.[0]?.key) return null;

    const worksKey = isbnData.works[0].key;
    const workData = await fetchJSON(`https://openlibrary.org${worksKey}.json`);
    if (!workData) return null;

    return extractDescription(workData.description);
  } catch {
    return null;
  }
}

async function fetchBySearch(title: string, author: string): Promise<string | null> {
  try {
    const cleanedTitle = cleanTitle(title);
    const params = new URLSearchParams({
      title: cleanedTitle,
      author: author || '',
      limit: '1',
      fields: 'key',
    });
    const searchData = await fetchJSON(`https://openlibrary.org/search.json?${params}`);
    if (!searchData?.docs?.[0]?.key) return null;

    const workKey = searchData.docs[0].key;
    const workData = await fetchJSON(`https://openlibrary.org${workKey}.json`);
    if (!workData) return null;

    return extractDescription(workData.description);
  } catch {
    return null;
  }
}

async function main() {
  const dbPath = findDbPath();
  console.log(`Using database: ${dbPath}`);
  const db = new Database(dbPath);

  const books = db.prepare(
    "SELECT id, title, author, isbn, isbn13 FROM books WHERE review IS NULL OR review = ''"
  ).all() as Array<{ id: number; title: string; author: string; isbn: string | null; isbn13: string | null }>;

  console.log(`Found ${books.length} books without synopses\n`);

  const updateStmt = db.prepare('UPDATE books SET review = ? WHERE id = ?');
  let fetched = 0;
  let failed = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const progress = `[${i + 1}/${books.length}]`;
    const isbn = book.isbn || book.isbn13?.replace(/^=?"?|"?$/g, '') || null;

    let description: string | null = null;

    // Strategy 1: Try by ISBN
    if (isbn) {
      console.log(`${progress} Trying ISBN ${isbn} for "${book.title}"...`);
      description = await fetchByISBN(isbn);
      await sleep(500);
    }

    // Strategy 2: Try by search
    if (!description) {
      console.log(`${progress} Trying search for "${cleanTitle(book.title)}" by ${book.author}...`);
      description = await fetchBySearch(book.title, book.author);
      await sleep(500);
    }

    if (description) {
      const cleaned = cleanSynopsis(description);
      updateStmt.run(cleaned, book.id);
      fetched++;
      console.log(`${progress} ✓ Saved synopsis for "${book.title}" (${cleaned.length} chars)\n`);
    } else {
      failed++;
      console.log(`${progress} ✗ No synopsis found for "${book.title}"\n`);
    }
  }

  db.close();
  console.log(`\nDone! Fetched: ${fetched}, Not found: ${failed}, Total: ${books.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
