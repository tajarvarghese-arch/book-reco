'use client';

import { useEffect, useState } from 'react';

type MindmapBook = {
  id: number;
  title: string;
  author: string | null;
  my_rating: number;
  cover_url: string | null;
  review: string | null;
  category: string;
};

type CategoryStat = {
  name: string;
  count: number;
  avgRating: number;
  fiveStarCount: number;
  color: string;
  books: MindmapBook[];
};

function RatingDots({ rating, size = 6 }: { rating: number; size?: number }) {
  if (!rating || rating === 0) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: i <= rating ? '#fff' : 'rgba(255,255,255,0.2)',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  );
}

export default function MindmapPage() {
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [selectedBook, setSelectedBook] = useState<MindmapBook | null>(null);
  const [synopsisText, setSynopsisText] = useState<string | null>(null);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'author'>('rating');

  useEffect(() => {
    fetch('/api/mindmap')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categoryStats);
        setTotalBooks(data.totalBooks);
      });
  }, []);

  const displayCats = filter
    ? categories.filter((c) => c.name === filter)
    : categories;

  const sortBooks = (books: MindmapBook[]) => {
    return [...books].sort((a, b) => {
      if (sortBy === 'rating') return (b.my_rating || 0) - (a.my_rating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return (a.author || '').localeCompare(b.author || '');
    });
  };

  const openBook = async (book: MindmapBook) => {
    setSelectedBook(book);
    setSynopsisText(null);
    setSynopsisLoading(true);
    try {
      const res = await fetch(`/api/books/synopsis?id=${book.id}`);
      const data = await res.json();
      setSynopsisText(data.synopsis || 'No synopsis available.');
    } catch {
      setSynopsisText('Failed to load synopsis.');
    }
    setSynopsisLoading(false);
  };

  if (categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141413]">
        <div className="text-[#b0aea5] text-sm">Loading your reading map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141413] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#141413]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Reading Map
            </h1>
            <p className="text-xs text-[#b0aea5]">
              {totalBooks} books across {categories.length} genres
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 transition">
              Dashboard
            </a>
            <a href="/recommendations" className="px-3 py-1.5 bg-[#d97757]/80 text-white rounded-lg text-xs hover:bg-[#d97757] transition">
              Recs
            </a>
          </div>
        </div>

        {/* Filter bar */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
              !filter ? 'bg-white text-[#141413]' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            All ({totalBooks})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setFilter(filter === cat.name ? null : cat.name)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition flex items-center gap-1.5 ${
                filter === cat.name ? 'text-white' : 'text-white/60 hover:text-white/80'
              }`}
              style={{
                background: filter === cat.name ? cat.color : 'rgba(255,255,255,0.07)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: cat.color }}
              />
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-1">
          {(['rating', 'title', 'author'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition ${
                sortBy === s ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {/* Treemap Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {displayCats.map((cat) => (
          <section key={cat.name}>
            {/* Genre Header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: cat.color }}
              />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: cat.color, fontFamily: 'var(--font-heading)' }}>
                {cat.name}
              </h2>
              <span className="text-xs text-white/30">
                {cat.count} books &middot; {cat.fiveStarCount} five-star &middot; avg {cat.avgRating}
              </span>
            </div>

            {/* Book Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {sortBooks(cat.books).map((book) => {
                const is5star = book.my_rating === 5;
                const hasCover = book.cover_url && book.cover_url !== 'none';
                return (
                  <div
                    key={book.id}
                    className={`rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 hover:ring-2 hover:ring-white/30 hover:scale-[1.02] ${
                      is5star ? 'col-span-2 sm:col-span-2' : ''
                    }`}
                    style={{ background: cat.color + '15', borderLeft: `3px solid ${cat.color}` }}
                    onClick={() => openBook(book)}
                  >
                    <div className={`flex ${is5star ? 'flex-row' : 'flex-row'} h-full`}>
                      {/* Cover */}
                      {hasCover ? (
                        <img
                          src={book.cover_url!}
                          alt=""
                          className={`object-cover shrink-0 ${is5star ? 'w-24 h-36' : 'w-16 h-24'}`}
                        />
                      ) : (
                        <div
                          className={`shrink-0 flex items-center justify-center ${is5star ? 'w-24 h-36' : 'w-16 h-24'}`}
                          style={{ background: cat.color + '30' }}
                        >
                          <span className="text-white/20 text-lg">📖</span>
                        </div>
                      )}

                      {/* Text */}
                      <div className={`flex-1 min-w-0 flex flex-col justify-center ${is5star ? 'p-3' : 'p-2'}`}>
                        <h3
                          className={`font-bold leading-tight text-white line-clamp-2 ${
                            is5star ? 'text-sm' : 'text-xs'
                          }`}
                        >
                          {book.title.replace(/\s*\(.*?\)\s*/g, '')}
                        </h3>
                        <p className="text-white/50 text-[10px] mt-0.5 truncate">
                          {book.author || 'Unknown'}
                        </p>
                        <div className="mt-1">
                          <RatingDots rating={book.my_rating} size={is5star ? 6 : 5} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="bg-[#1a1a19] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover banner */}
            {selectedBook.cover_url && selectedBook.cover_url !== 'none' && (
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedBook.cover_url}
                  alt=""
                  className="w-full h-full object-cover blur-sm scale-110 opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a19] to-transparent" />
                <img
                  src={selectedBook.cover_url}
                  alt={selectedBook.title}
                  className="absolute bottom-4 left-6 w-20 rounded-lg shadow-2xl"
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2
                    className="text-xl font-bold leading-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {selectedBook.title}
                  </h2>
                  <p className="text-sm text-[#b0aea5] mt-1">
                    {selectedBook.author || 'Unknown author'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-white/30 hover:text-white text-2xl ml-4 -mt-1"
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <RatingDots rating={selectedBook.my_rating} size={10} />
                {selectedBook.my_rating > 0 && (
                  <span className="text-xs text-white/40">
                    {selectedBook.my_rating}/5
                  </span>
                )}
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: categories.find((c) => c.name === selectedBook.category)?.color + '30',
                    color: categories.find((c) => c.name === selectedBook.category)?.color,
                  }}
                >
                  {selectedBook.category}
                </span>
              </div>

              <div className="mt-5 pt-5 border-t border-white/10">
                <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                  Synopsis
                </h3>
                {synopsisLoading ? (
                  <p className="text-sm text-white/40 italic">Loading synopsis...</p>
                ) : (
                  <p className="text-sm text-white/70 leading-relaxed">
                    {synopsisText || 'No synopsis available.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
