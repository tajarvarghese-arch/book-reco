import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { id, rating } = await request.json();
  if (!id || rating === undefined || rating < 0 || rating > 5) {
    return NextResponse.json({ error: 'Invalid id or rating (0-5)' }, { status: 400 });
  }
  const db = getDb();
  db.prepare('UPDATE books SET my_rating = ? WHERE id = ?').run(rating, id);
  return NextResponse.json({ success: true });
}
