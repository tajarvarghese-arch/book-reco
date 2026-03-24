import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();

  // Children's book authors
  const childrenAuthors = [
    'Dan Gutman', 'Dav Pilkey', 'Lincoln Peirce', 'Gale Galligan',
    'Raina Telgemeier', 'Gabriela  Epstein', 'Rebecca Elliott',
    'Annie Barrows', 'Mary Pope Osborne', 'Sandra Boynton',
    'Jeff Kinney', 'Rachel Renée Russell',
  ];

  // Romance authors
  const romanceAuthors = [
    'Colleen Hoover', 'Rebecca Yarros', 'Nicholas Sparks',
    'Sarah J. Maas', 'Emily Henry', 'Ali Hazelwood',
  ];

  const authorPlaceholders = [...childrenAuthors, ...romanceAuthors].map(() => '?').join(',');

  const candidates = db.prepare(`
    SELECT id, title, author, num_pages, shelf, source,
      CASE
        WHEN author IN (${childrenAuthors.map(() => '?').join(',')}) THEN 'children'
        WHEN author IN (${romanceAuthors.map(() => '?').join(',')}) THEN 'romance'
        WHEN title LIKE '%Dog Man%' OR title LIKE '%Cat Kid%' OR title LIKE '%Big Nate%'
          OR title LIKE '%Baby-Sitters%' OR title LIKE '%My Weird School%'
          OR title LIKE '%Diary of a Wimpy%' OR title LIKE '%Captain Underpants%'
          OR title LIKE '%Owl Diaries%' OR title LIKE '%Ivy and Bean%'
          OR title LIKE '%Ivy & Bean%'
          THEN 'children'
        WHEN title LIKE '%Frozen%Guide%' OR title LIKE '%MOO, BAA%' THEN 'children'
        WHEN title LIKE '%Fourth Wing%' OR title LIKE '%Iron Flame%'
          OR title LIKE '%It Ends with Us%' OR title LIKE '%It Starts with Us%'
          THEN 'romance'
        ELSE 'other'
      END as category
    FROM books
    WHERE author IN (${authorPlaceholders})
      OR title LIKE '%Dog Man%' OR title LIKE '%Cat Kid%' OR title LIKE '%Big Nate%'
      OR title LIKE '%Baby-Sitters%' OR title LIKE '%My Weird School%'
      OR title LIKE '%Diary of a Wimpy%' OR title LIKE '%Captain Underpants%'
      OR title LIKE '%Owl Diaries%' OR title LIKE '%Ivy and Bean%' OR title LIKE '%Ivy & Bean%'
      OR title LIKE '%Frozen%Guide%' OR title LIKE '%MOO, BAA%'
      OR title LIKE '%Fourth Wing%' OR title LIKE '%Iron Flame%'
      OR title LIKE '%It Ends with Us%' OR title LIKE '%It Starts with Us%'
    ORDER BY category, author, title
  `).all(...childrenAuthors, ...romanceAuthors, ...childrenAuthors, ...romanceAuthors);

  return NextResponse.json({ candidates });
}
