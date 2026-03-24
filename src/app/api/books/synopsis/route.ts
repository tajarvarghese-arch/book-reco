import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'No id provided' }, { status: 400 });
  }

  const db = getDb();
  const book = db.prepare('SELECT id, title, author, isbn, isbn13, review FROM books WHERE id = ?').get(Number(id)) as {
    id: number; title: string; author: string | null; isbn: string | null; isbn13: string | null; review: string | null;
  } | undefined;

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // If we already have a review/synopsis stored, return it
  if (book.review && book.review.length > 10) {
    return NextResponse.json({ synopsis: book.review });
  }

  // Try Open Library search for description
  let synopsis: string | null = null;

  // Strategy 1: Search by ISBN
  const isbn = book.isbn13 || book.isbn;
  if (isbn) {
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          synopsis = typeof data.description === 'string' ? data.description : data.description.value;
        }
        // If no description on edition, try the work
        if (!synopsis && data.works?.[0]?.key) {
          const workRes = await fetch(`https://openlibrary.org${data.works[0].key}.json`);
          if (workRes.ok) {
            const workData = await workRes.json();
            if (workData.description) {
              synopsis = typeof workData.description === 'string' ? workData.description : workData.description.value;
            }
          }
        }
      }
    } catch { /* ignore */ }
  }

  // Strategy 2: Search by title + author
  if (!synopsis && book.title) {
    const titleClean = book.title.replace(/\(.*?\)/g, '').trim();
    try {
      const params = new URLSearchParams({ title: titleClean, limit: '1', fields: 'key' });
      if (book.author) params.set('author', book.author);
      const res = await fetch(`https://openlibrary.org/search.json?${params}`);
      if (res.ok) {
        const data = await res.json();
        const workKey = data?.docs?.[0]?.key;
        if (workKey) {
          const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
          if (workRes.ok) {
            const workData = await workRes.json();
            if (workData.description) {
              synopsis = typeof workData.description === 'string' ? workData.description : workData.description.value;
            }
          }
        }
      }
    } catch { /* ignore */ }
  }

  if (synopsis) {
    // Trim to reasonable length and clean up
    synopsis = synopsis.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    if (synopsis.length > 600) {
      synopsis = synopsis.substring(0, 597) + '...';
    }
    // Cache it in the review field
    db.prepare("UPDATE books SET review = ? WHERE id = ? AND (review IS NULL OR review = '')").run(synopsis, book.id);
  }

  return NextResponse.json({ synopsis: synopsis || 'No synopsis available for this book.' });
}
