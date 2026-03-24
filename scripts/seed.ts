import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const DB_PATH = path.join(process.cwd(), 'data', 'books.db');
const CSV_PATH = path.join(process.cwd(), 'data', 'goodreads_library_export.csv');

// Remove existing DB to start fresh
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

const insert = db.prepare(`
  INSERT INTO books (title, author, isbn, isbn13, my_rating, avg_rating, publisher, binding, num_pages, year_published, original_year, date_read, date_added, shelf, source, review, read_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// --- 1. Import Goodreads CSV ---
console.log('Importing Goodreads data...');
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

let goodreadsCount = 0;
const goodreadsTitles = new Set<string>();

for (const row of records) {
  const title = row['Title']?.trim();
  if (!title) continue;

  const isbn = row['ISBN']?.replace(/[="]/g, '').trim() || null;
  const isbn13 = row['ISBN13']?.replace(/[="]/g, '').trim() || null;
  const dateRead = row['Date Read']?.trim() ? row['Date Read'].replace(/\//g, '-') : null;
  const dateAdded = row['Date Added']?.trim() ? row['Date Added'].replace(/\//g, '-') : null;
  const shelf = row['Exclusive Shelf']?.trim() || 'read';

  insert.run(
    title,
    row['Author']?.trim() || null,
    isbn || null,
    isbn13 || null,
    parseInt(row['My Rating']) || 0,
    parseFloat(row['Average Rating']) || null,
    row['Publisher']?.trim() || null,
    row['Binding']?.trim() || null,
    parseInt(row['Number of Pages']) || null,
    parseInt(row['Year Published']) || null,
    parseInt(row['Original Publication Year']) || null,
    dateRead,
    dateAdded,
    shelf,
    'goodreads',
    row['My Review']?.trim() || null,
    parseInt(row['Read Count']) || 1
  );
  goodreadsTitles.add(title.toLowerCase());
  goodreadsCount++;
}
console.log(`  Imported ${goodreadsCount} books from Goodreads`);

// --- 2. Import KanbanFlow data ---
console.log('Importing KanbanFlow data...');

interface KanbanBook {
  title: string;
  author: string | null;
  date_finished: string | null;
  shelf: string;
}

const kanbanBooks: KanbanBook[] = [
  // DONE (read) books with dates
  { title: "The Buffalo Hunter", author: "Stephen Graham", date_finished: "2026-01-11", shelf: "read" },
  { title: "Rendezvous with Rama", author: "Arthur C. Clarke", date_finished: "2025-06-16", shelf: "read" },
  { title: "Freedom's Forge", author: null, date_finished: "2025-06-16", shelf: "read" },
  { title: "The Maniac", author: "Benjamin Labatut", date_finished: "2025-01-13", shelf: "read" },
  { title: "When We Cease to Understand the World", author: "Benjamin Labatut", date_finished: "2025-01-13", shelf: "read" },
  { title: "Elon Musk", author: "Walter Isaacson", date_finished: "2025-01-02", shelf: "read" },
  { title: "A Time of Gifts", author: "Patrick Leigh Fermor", date_finished: "2024-09-24", shelf: "read" },
  { title: "Shogun", author: "James Clavell", date_finished: "2024-09-24", shelf: "read" },
  { title: "Fourth Wing", author: "Rebecca Yarros", date_finished: "2024-01-29", shelf: "read" },
  { title: "11/22/63", author: "Stephen King", date_finished: "2024-01-11", shelf: "read" },
  { title: "The Wager", author: "David Grann", date_finished: "2023-11-10", shelf: "read" },
  { title: "The Red Queen", author: "Matt Ridley", date_finished: "2023-11-10", shelf: "read" },
  { title: "Pandora's Star", author: "Peter F. Hamilton", date_finished: "2023-11-10", shelf: "read" },
  { title: "Judas Unchained", author: "Peter F. Hamilton", date_finished: "2023-11-10", shelf: "read" },
  { title: "Blood Meridian", author: "Cormac McCarthy", date_finished: "2023-03-17", shelf: "read" },
  { title: "Angle of Repose", author: "Wallace Stegner", date_finished: "2022-12-23", shelf: "read" },
  { title: "Friends, Lovers, and the Big Terrible Thing", author: "Matthew Perry", date_finished: "2022-11-10", shelf: "read" },
  { title: "The Forever War", author: "Joe Haldeman", date_finished: "2022-09-14", shelf: "read" },
  { title: "This Tender Land", author: "William Kent Krueger", date_finished: "2022-09-02", shelf: "read" },
  { title: "Cloud Cuckoo Land", author: "Anthony Doerr", date_finished: "2022-07-31", shelf: "read" },
  { title: "Dopamine Nation", author: "Anna Lembke", date_finished: "2022-05-22", shelf: "read" },
  { title: "Finding Ultra", author: "Rich Roll", date_finished: "2022-05-03", shelf: "read" },
  { title: "Out There: Ultrarecovery", author: null, date_finished: "2022-04-15", shelf: "read" },
  { title: "The Executioner's Song", author: "Norman Mailer", date_finished: "2022-03-22", shelf: "read" },
  { title: "Crossroads", author: "Jonathan Franzen", date_finished: "2021-11-22", shelf: "read" },
  { title: "What Makes Sammy Run?", author: "Budd Schulberg", date_finished: "2021-10-15", shelf: "read" },
  { title: "Alcohol Explained", author: "William Porter", date_finished: "2021-10-07", shelf: "read" },
  { title: "The Immortal Hulk", author: "Al Ewing", date_finished: "2021-09-30", shelf: "read" },
  { title: "Project Hail Mary", author: "Andy Weir", date_finished: "2021-09-24", shelf: "read" },
  { title: "You Are a Badass", author: "Jen Sincero", date_finished: "2021-09-18", shelf: "read" },
  { title: "The Wanderers", author: "Chuck Wendig", date_finished: "2020-05-01", shelf: "read" },
  { title: "Empire of the Summer Moon", author: "S. C. Gwynne", date_finished: "2020-04-01", shelf: "read" },
  { title: "The Alchemist", author: "Paulo Coelho", date_finished: "2020-01-08", shelf: "read" },
  { title: "The Silent Patient", author: "Alex Michaelides", date_finished: "2020-01-08", shelf: "read" },
  { title: "East of Eden", author: "John Steinbeck", date_finished: "2019-10-20", shelf: "read" },
  { title: "Uncle Vanya", author: "Anton Chekhov", date_finished: "2019-10-07", shelf: "read" },
  { title: "Lifespan", author: "David Sinclair", date_finished: "2019-10-07", shelf: "read" },
  { title: "My Sister, the Serial Killer", author: "Oyinkan Braithwaite", date_finished: "2019-09-30", shelf: "read" },
  { title: "Lost Connections", author: "Johann Hari", date_finished: "2019-09-15", shelf: "read" },
  { title: "Hyperion", author: "Dan Simmons", date_finished: "2019-08-15", shelf: "read" },
  { title: "Ego Is the Enemy", author: "Ryan Holiday", date_finished: "2019-07-23", shelf: "read" },
  { title: "Wool", author: "Hugh Howey", date_finished: "2019-07-06", shelf: "read" },
  { title: "Moby-Dick", author: "Herman Melville", date_finished: "2019-06-20", shelf: "read" },
  { title: "The Mindbody Prescription", author: "John E. Sarno", date_finished: "2019-05-27", shelf: "read" },
  { title: "This Naked Mind", author: "Annie Grace", date_finished: "2019-05-27", shelf: "read" },
  { title: "The First Tycoon", author: "T.J. Stiles", date_finished: "2019-04-10", shelf: "read" },
  { title: "Dead Wake: The Last Crossing of the Lusitania", author: "Erik Larson", date_finished: "2019-03-29", shelf: "read" },
  { title: "Where the Crawdads Sing", author: "Delia Owens", date_finished: "2019-03-10", shelf: "read" },
  { title: "How to Change Your Mind", author: "Michael Pollan", date_finished: "2019-02-07", shelf: "read" },
  { title: "Extreme Ownership", author: "Jocko Willink", date_finished: "2019-01-03", shelf: "read" },
  { title: "Can't Hurt Me", author: "David Goggins", date_finished: "2019-01-03", shelf: "read" },
  { title: "A Gentleman in Moscow", author: "Amor Towles", date_finished: "2018-11-12", shelf: "read" },
  { title: "Rules of Civility", author: "Amor Towles", date_finished: "2018-11-12", shelf: "read" },
  { title: "Foundation", author: "Isaac Asimov", date_finished: "2018-09-04", shelf: "read" },
  { title: "Pachinko", author: "Min Jin Lee", date_finished: "2018-08-13", shelf: "read" },
  { title: "The Friends of Eddie Coyle", author: "George V. Higgins", date_finished: "2018-08-13", shelf: "read" },
  { title: "Coyote America", author: "Dan Flores", date_finished: "2018-07-27", shelf: "read" },
  { title: "I Don't Want to Talk About It", author: "Terrence Real", date_finished: "2018-07-17", shelf: "read" },
  { title: "Factfulness", author: "Hans Rosling", date_finished: "2018-04-24", shelf: "read" },
  { title: "The Alienist", author: "Caleb Carr", date_finished: "2018-04-24", shelf: "read" },
  { title: "Siddhartha", author: "Hermann Hesse", date_finished: "2018-02-27", shelf: "read" },
  { title: "The Lost City of the Monkey God", author: "Douglas Preston", date_finished: "2018-02-22", shelf: "read" },
  { title: "Death's End", author: "Liu Cixin", date_finished: "2018-01-13", shelf: "read" },
  { title: "The Dark Forest", author: "Liu Cixin", date_finished: "2017-11-30", shelf: "read" },
  { title: "Hillbilly Elegy", author: "J.D. Vance", date_finished: "2017-10-23", shelf: "read" },
  { title: "Middlesex", author: "Jeffrey Eugenides", date_finished: "2017-10-03", shelf: "read" },
  { title: "Beartown", author: "Fredrik Backman", date_finished: "2017-09-05", shelf: "read" },
  { title: "The Old Man and the Sea", author: "Ernest Hemingway", date_finished: "2017-08-16", shelf: "read" },
  { title: "The Better Angels of Our Nature", author: "Steven Pinker", date_finished: "2017-08-08", shelf: "read" },
  { title: "Cathedral", author: "Raymond Carver", date_finished: "2017-05-19", shelf: "read" },
  { title: "In Other Rooms, Other Wonders", author: "Daniyal Mueenuddin", date_finished: "2017-04-28", shelf: "read" },
  { title: "American Gods", author: "Neil Gaiman", date_finished: "2017-04-21", shelf: "read" },
  { title: "Infinite Jest", author: "David Foster Wallace", date_finished: "2017-03-31", shelf: "read" },
  { title: "Point Omega", author: "Don DeLillo", date_finished: "2017-01-23", shelf: "read" },
  { title: "The Three-Body Problem", author: "Liu Cixin", date_finished: "2017-01-21", shelf: "read" },

  // TO-DO (want to read) books
  { title: "The Guns of August", author: "Barbara Tuchman", date_finished: null, shelf: "to-read" },
  { title: "Endurance", author: "Alfred Lansing", date_finished: null, shelf: "to-read" },
  { title: "I Contain Multitudes", author: "Ed Yong", date_finished: null, shelf: "to-read" },
  { title: "When Things Fall Apart", author: "Pema Chodron", date_finished: null, shelf: "to-read" },
  { title: "What We Talk About When We Talk About Love", author: "Raymond Carver", date_finished: null, shelf: "to-read" },
  { title: "Super Thirty", author: null, date_finished: null, shelf: "to-read" },
  { title: "Structures: Or Why Things Don't Fall Down", author: "J.E. Gordon", date_finished: null, shelf: "to-read" },
  { title: "Snow", author: "Orhan Pamuk", date_finished: null, shelf: "to-read" },
  { title: "English, August", author: "Upamanyu Chatterjee", date_finished: null, shelf: "to-read" },
];

let kanbanCount = 0;
for (const book of kanbanBooks) {
  // Check if this book already exists from Goodreads (fuzzy match on title)
  const titleLower = book.title.toLowerCase();
  const exists = goodreadsTitles.has(titleLower) ||
    [...goodreadsTitles].some(t =>
      t.includes(titleLower) || titleLower.includes(t) ||
      t.replace(/[^a-z0-9]/g, '') === titleLower.replace(/[^a-z0-9]/g, '')
    );

  if (!exists) {
    insert.run(
      book.title,
      book.author,
      null, null,
      0,
      null, null, null, null, null, null,
      book.date_finished,
      book.date_finished,
      book.shelf,
      'kanbanflow',
      null,
      book.shelf === 'read' ? 1 : 0
    );
    kanbanCount++;
  }
}
console.log(`  Imported ${kanbanCount} unique books from KanbanFlow (skipped duplicates)`);

// Print summary
const total = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number };
const readCount = db.prepare("SELECT COUNT(*) as count FROM books WHERE shelf = 'read'").get() as { count: number };
const toReadCount = db.prepare("SELECT COUNT(*) as count FROM books WHERE shelf = 'to-read'").get() as { count: number };
const currentlyReading = db.prepare("SELECT COUNT(*) as count FROM books WHERE shelf = 'currently-reading'").get() as { count: number };

console.log('\n--- Database Summary ---');
console.log(`Total books: ${total.count}`);
console.log(`Read: ${readCount.count}`);
console.log(`Currently reading: ${currentlyReading.count}`);
console.log(`To read: ${toReadCount.count}`);

db.close();
console.log('\nDatabase seeded successfully!');
