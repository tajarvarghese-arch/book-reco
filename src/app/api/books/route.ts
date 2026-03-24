import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);

  const shelf = searchParams.get('shelf');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'date_read';
  const order = searchParams.get('order') || 'DESC';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = 'SELECT * FROM books WHERE 1=1';
  const params: (string | number)[] = [];

  if (shelf) {
    query += ' AND shelf = ?';
    params.push(shelf);
  }

  if (search) {
    query += ' AND (title LIKE ? OR author LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const validSorts = ['date_read', 'title', 'author', 'my_rating', 'avg_rating', 'num_pages', 'date_added', 'year_published'];
  const sortCol = validSorts.includes(sort) ? sort : 'date_read';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  // SQLite doesn't support NULLS LAST — use CASE expression to push nulls to bottom
  query += ` ORDER BY CASE WHEN ${sortCol} IS NULL THEN 1 ELSE 0 END, ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const books = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM books WHERE 1=1';
  const countParams: (string | number)[] = [];
  if (shelf) { countQuery += ' AND shelf = ?'; countParams.push(shelf); }
  if (search) { countQuery += ' AND (title LIKE ? OR author LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }

  const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

  return NextResponse.json({ books, total });
}
