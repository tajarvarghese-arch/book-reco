import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { title, author, pages, year, isbn, coverUrl, shelf, rating } = await request.json();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO books (title, author, num_pages, original_year, isbn, cover_url, shelf, my_rating, source, date_read, date_added)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, datetime('now'))
  `).run(
    title,
    author || null,
    pages || null,
    year || null,
    isbn || null,
    coverUrl || null,
    shelf || 'read',
    rating || 0,
    shelf === 'read' ? new Date().toISOString().split('T')[0] : null
  );
  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}
