import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn`
    );
    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }
    const data = await res.json();
    const results = (data.docs || []).map((doc: any) => ({
      key: doc.key,
      title: doc.title,
      author: doc.author_name?.[0] || null,
      year: doc.first_publish_year || null,
      pages: doc.number_of_pages_median || null,
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      isbn: doc.isbn?.[0] || null,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
