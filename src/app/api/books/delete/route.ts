import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'No id provided' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
  return NextResponse.json({ deleted: result.changes });
}
