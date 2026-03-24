'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import BookCover from '@/components/BookCover';
import ThemeToggle from '@/components/ThemeToggle';

type Book = {
  id: number;
  title: string;
  author: string | null;
  my_rating: number;
  avg_rating: number | null;
  num_pages: number | null;
  date_read: string | null;
  shelf: string;
  source: string;
  binding: string | null;
  publisher: string | null;
  year_published: number | null;
  original_year: number | null;
  cover_url: string | null;
};

type Stats = {
  summary: {
    totalBooks: number;
    totalPages: number;
    avgRating: number;
    currentlyReading: number;
    toRead: number;
  };
  booksPerYear: { year: string; count: number }[];
  topAuthors: { author: string; count: number }[];
  ratingDist: { rating: number; count: number }[];
  booksPerMonth: { month: string; count: number }[];
  pagesPerYear: { year: string; pages: number }[];
  topRated: Book[];
  longestBooks: (Book & { num_pages: number })[];
  sourceBreakdown: { source: string; count: number }[];
  bindingBreakdown: { format: string; count: number }[];
  monthlyHeatmap: { year: string; month: number; count: number }[];
  decadeDistribution: { decade: number; count: number }[];
  ratingTrend: { year: string; avg_rating: number }[];
  avgLengthTrend: { year: string; avg_pages: number }[];
  uniqueAuthors: number;
  readingStreak: { current: number; longest: number };
  readingPace: number | null;
};

function Stars({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`inline-block w-2.5 h-2.5 rounded-full transition-colors ${
            i <= rating ? 'bg-[#d97757]' : 'bg-[#e8e6dc]'
          } ${onRate ? 'cursor-pointer hover:bg-[#d97757] hover:opacity-70' : ''}`}
          onClick={(e) => { e.stopPropagation(); onRate?.(i === rating ? 0 : i); }}
        />
      ))}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="brand-card stat-glow p-5">
      <p className="text-xs uppercase tracking-wider" style={{fontFamily: 'var(--font-heading)', color: 'var(--text-muted)'}}>
        {label}
      </p>
      <p className="text-3xl font-bold mt-1" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>{value}</p>
      {sub && <p className="text-sm mt-1" style={{color: 'var(--text-secondary)'}}>{sub}</p>}
    </div>
  );
}

function ReadingGoals({ stats }: { stats: Stats }) {
  const goal = 24; // yearly goal
  const currentYear = new Date().getFullYear().toString();
  const booksThisYear = stats.booksPerYear.find(b => b.year === currentYear)?.count || 0;
  const progress = Math.min(booksThisYear / goal, 1);
  const monthsElapsed = new Date().getMonth() + 1;
  const expectedPace = Math.round((goal / 12) * monthsElapsed);
  const ahead = booksThisYear - expectedPace;
  const circumference = 2 * Math.PI * 45;

  return (
    <div className="brand-card p-6">
      <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>
        {currentYear} Reading Goal
      </h2>
      <div className="flex items-center gap-6">
        {/* Progress Ring */}
        <div className="relative shrink-0">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="45" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="55" cy="55" r="45" fill="none"
              stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
              className="progress-ring-circle"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress * circumference)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{fontFamily: 'var(--font-heading)', color: 'var(--text-primary)'}}>{booksThisYear}</span>
            <span className="text-[10px]" style={{color: 'var(--text-muted)'}}>of {goal}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{color: 'var(--text-secondary)'}}>Progress</span>
            <span className="text-sm font-bold" style={{color: 'var(--text-primary)'}}>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background: 'var(--border)'}}>
            <div className="h-full rounded-full bar-animated" style={{width: `${progress * 100}%`, background: 'var(--accent)'}} />
          </div>
          <p className="text-xs" style={{color: ahead >= 0 ? '#6b8f5e' : '#e07a5f'}}>
            {ahead >= 0 ? `${ahead} books ahead of pace` : `${Math.abs(ahead)} books behind pace`}
          </p>
          {stats.readingStreak && (
            <div className="flex gap-4 mt-2 pt-2" style={{borderTop: '1px solid var(--border)'}}>
              <div>
                <span className="text-lg font-bold" style={{color: 'var(--accent)'}}>{stats.readingStreak.current}</span>
                <span className="text-[10px] ml-1" style={{color: 'var(--text-muted)'}}>mo streak</span>
              </div>
              <div>
                <span className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>{stats.readingStreak.longest}</span>
                <span className="text-[10px] ml-1" style={{color: 'var(--text-muted)'}}>best</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color = 'var(--accent)', maxBars }: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?: string;
  maxBars?: number;
}) {
  const items = maxBars ? data.slice(-maxBars) : data;
  const maxVal = Math.max(...items.map((d) => d[valueKey] as number), 1);
  return (
    <div className="space-y-2">
      {items.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs w-20 text-right shrink-0" style={{color: 'var(--text-secondary)'}}>{String(d[labelKey])}</span>
          <div className="flex-1 rounded-full h-4 overflow-hidden" style={{background: 'var(--border)'}}>
            <div
              className="h-full rounded-full bar-animated"
              style={{ width: `${((d[valueKey] as number) / maxVal) * 100}%`, background: color, animationDelay: `${i * 50}ms` }}
            />
          </div>
          <span className="text-xs font-semibold w-10" style={{color: 'var(--text-primary)'}}>{String(d[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

function groupBy<T extends Record<string, unknown>>(arr: T[], key: string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [shelf, setShelf] = useState('read');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date_read');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<'dashboard' | 'books'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<any[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [synopsisBook, setSynopsisBook] = useState<Book | null>(null);
  const [synopsisText, setSynopsisText] = useState<string | null>(null);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const perPage = 30;

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats);
  }, []);

  const fetchBooks = useCallback(() => {
    const params = new URLSearchParams({
      shelf, sort, order,
      limit: String(perPage),
      offset: String(page * perPage),
    });
    if (search) params.set('search', search);
    fetch(`/api/books?${params}`).then((r) => r.json()).then((data) => {
      setBooks(data.books);
      setTotal(data.total);
    });
  }, [shelf, search, sort, order, page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  useEffect(() => { setPage(0); }, [shelf, search, sort, order]);

  const handleRate = async (bookId: number, rating: number) => {
    await fetch('/api/books/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookId, rating }),
    });
    fetchBooks();
    fetch('/api/stats').then((r) => r.json()).then(setStats);
  };

  const handleDelete = async (bookId: number) => {
    if (!window.confirm('Delete this book from your library?')) return;
    await fetch('/api/books/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookId }),
    });
    fetchBooks();
    fetch('/api/stats').then((r) => r.json()).then(setStats);
  };

  const searchExternalBooks = async (q: string) => {
    if (q.length < 2) { setAddResults([]); return; }
    setAddLoading(true);
    const res = await fetch(`/api/books/search-external?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setAddResults(data.results);
    setAddLoading(false);
  };

  const handleAddBook = async (book: any, bookShelf: string) => {
    await fetch('/api/books/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        pages: book.pages,
        year: book.year,
        isbn: book.isbn,
        coverUrl: book.coverUrl,
        shelf: bookShelf,
        rating: 0,
      }),
    });
    fetchBooks();
    fetch('/api/stats').then((r) => r.json()).then(setStats);
    setAddResults(prev => prev.filter(r => r.key !== book.key));
  };

  const openSynopsis = async (book: Book) => {
    setSynopsisBook(book);
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

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--bg-primary)'}}>
        <div className="text-sm brand-fade" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Loading library...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen" style={{background: 'var(--bg-primary)'}}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 85%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold gradient-text" style={{fontFamily: 'var(--font-heading)'}}>Book Tracker</h1>
            <p className="text-xs sm:text-sm" style={{color: 'var(--text-secondary)'}}>{stats.summary.totalBooks} books read</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a href="/mindmap" className="brand-btn px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#5b8fb9] text-white text-xs sm:text-sm whitespace-nowrap">Map</a>
            <a href="/recommendations" className="brand-btn px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#6b8f5e] text-white text-xs sm:text-sm whitespace-nowrap">Recs</a>
            <a href="/screen" className="brand-btn px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Edit</a>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2 sm:pb-3 flex gap-2">
          <button onClick={() => setTab('dashboard')} className={`brand-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${tab === 'dashboard' ? 'bg-[#e07a5f] text-white' : ''}`} style={tab !== 'dashboard' ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}>Dashboard</button>
          <button onClick={() => setTab('books')} className={`brand-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${tab === 'books' ? 'bg-[#e07a5f] text-white' : ''}`} style={tab !== 'books' ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}>All Books</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {tab === 'dashboard' ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Books Read" value={stats.summary.totalBooks} />
              <StatCard
                label="Pages Read"
                value={stats.summary.totalPages.toLocaleString()}
                sub={`~${Math.round(stats.summary.totalPages / Math.max(stats.summary.totalBooks, 1))} avg pages/book`}
              />
              <StatCard label="Avg Rating" value={stats.summary.avgRating} sub="out of 5" />
              <StatCard label="Currently Reading" value={stats.summary.currentlyReading} />
              <StatCard label="To Read" value={stats.summary.toRead} />
            </div>

            {/* Reading Goals */}
            <ReadingGoals stats={stats} />

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Books Per Year</h2>
                <BarChart data={stats.booksPerYear} labelKey="year" valueKey="count" color="#6b8f5e" />
              </div>

              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Most Read Authors</h2>
                <BarChart data={stats.topAuthors} labelKey="author" valueKey="count" color="#5b8fb9" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Rating Distribution</h2>
                <BarChart data={stats.ratingDist} labelKey="rating" valueKey="count" color="#e07a5f" />
              </div>

              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Reading Format</h2>
                <BarChart data={stats.bindingBreakdown} labelKey="format" valueKey="count" color="#6b8f5e" />
              </div>
            </div>

            <div className="brand-card p-6">
              <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Pages Read Per Year</h2>
              <BarChart data={stats.pagesPerYear} labelKey="year" valueKey="pages" color="#5b8fb9" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>5-Star Books</h2>
                <div className="space-y-3">
                  {stats.topRated.map((b, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{color: 'var(--text-primary)'}}>{b.title}</p>
                        <p className="text-xs" style={{color: 'var(--text-secondary)'}}>{b.author}</p>
                      </div>
                      <span className="text-xs shrink-0 ml-2" style={{color: 'var(--text-muted)'}}>{b.date_read}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Longest Books</h2>
                <div className="space-y-3">
                  {stats.longestBooks.map((b, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{color: 'var(--text-primary)'}}>{b.title}</p>
                        <p className="text-xs" style={{color: 'var(--text-secondary)'}}>{b.author}</p>
                      </div>
                      <span className="text-xs font-bold shrink-0 ml-2" style={{color: '#6b8f5e'}}>{b.num_pages} pg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="brand-card p-6 max-w-md">
              <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Data Sources</h2>
              <BarChart data={stats.sourceBreakdown} labelKey="source" valueKey="count" color="#6b8f5e" />
            </div>

            {/* Enhanced Analytics */}

            {/* Monthly Reading Heatmap */}
            {stats.monthlyHeatmap && stats.monthlyHeatmap.length > 0 && (
              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Reading Heatmap</h2>
                <div className="space-y-1 overflow-x-auto">
                  {Object.entries(groupBy(stats.monthlyHeatmap as unknown as Record<string, unknown>[], 'year')).map(([year, months]) => (
                    <div key={year} className="flex items-center gap-1">
                      <span className="text-xs text-[#b0aea5] w-10 sm:w-12 shrink-0">{year}</span>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = months.find((item: Record<string, unknown>) => (item as unknown as { month: number }).month === i + 1);
                        const count = m ? (m as unknown as { count: number }).count : 0;
                        const intensity = count === 0 ? 'bg-[#e8e6dc]' : count <= 1 ? 'bg-[#d4c5b0]' : count <= 3 ? 'bg-[#d97757]/60' : 'bg-[#d97757]';
                        return <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 rounded shrink-0 ${intensity}`} title={`${year}-${String(i + 1).padStart(2, '0')}: ${count} books`} />;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Publication Decade Distribution */}
            {stats.decadeDistribution && stats.decadeDistribution.length > 0 && (
              <div className="brand-card p-6">
                <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Publication Decades</h2>
                <BarChart data={stats.decadeDistribution} labelKey="decade" valueKey="count" color="#5b8fb9" />
              </div>
            )}

            {/* Rating & Length Trends */}
            <div className="grid md:grid-cols-2 gap-6">
              {stats.ratingTrend && stats.ratingTrend.length > 0 && (
                <div className="brand-card p-6">
                  <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Rating Trend</h2>
                  <BarChart data={stats.ratingTrend} labelKey="year" valueKey="avg_rating" color="#e07a5f" />
                </div>
              )}
              {stats.avgLengthTrend && stats.avgLengthTrend.length > 0 && (
                <div className="brand-card p-6">
                  <h2 className="text-sm font-semibold mb-4" style={{fontFamily: 'var(--font-heading)', color: 'var(--accent)'}}>Avg Book Length</h2>
                  <BarChart data={stats.avgLengthTrend} labelKey="year" valueKey="avg_pages" color="#5b8fb9" />
                </div>
              )}
            </div>

            {/* Reading Streak + Author Diversity */}
            {stats.readingStreak && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Current Streak" value={`${stats.readingStreak.current} mo`} />
                <StatCard label="Best Streak" value={`${stats.readingStreak.longest} mo`} />
                <StatCard label="Unique Authors" value={stats.uniqueAuthors} />
                <StatCard label="Avg Days/Book" value={stats.readingPace || '-'} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <input
                type="text"
                placeholder="Search books or authors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="brand-input px-3 sm:px-4 py-2 text-sm w-full sm:w-64"
              />
              <select
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                className="brand-select px-3 py-2 text-sm"
              >
                <option value="read">Read ({stats.summary.totalBooks})</option>
                <option value="currently-reading">Currently Reading ({stats.summary.currentlyReading})</option>
                <option value="to-read">To Read ({stats.summary.toRead})</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="brand-select px-3 py-2 text-sm"
              >
                <option value="date_read">Date Read</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="my_rating">My Rating</option>
                <option value="avg_rating">Avg Rating</option>
                <option value="num_pages">Pages</option>
              </select>
              <button
                onClick={() => setOrder(order === 'DESC' ? 'ASC' : 'DESC')}
                className="brand-btn px-3 py-2 bg-white border border-[#e8e6dc] text-[#b0aea5] text-sm"
              >
                {order === 'DESC' ? '\u2193 Desc' : '\u2191 Asc'}
              </button>
              <button onClick={() => setShowAddModal(true)} className="brand-btn px-4 py-2 bg-[#d97757] text-white text-sm">
                + Add Book
              </button>
              <span className="text-sm text-[#b0aea5] ml-auto">{total} books</span>
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {books.map((book) => (
                <div key={book.id} className="brand-card p-2 sm:p-3 flex flex-col items-center text-center group relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => openSynopsis(book)}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(book.id); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-50 text-red-400 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 z-10"
                    title="Delete book"
                  >
                    &times;
                  </button>
                  <BookCover coverUrl={book.cover_url} title={book.title} size="md" />
                  <h3 className="text-sm font-semibold text-[#141413] mt-2 line-clamp-2 leading-tight">{book.title}</h3>
                  <p className="text-xs text-[#b0aea5] mt-1">{book.author || 'Unknown'}</p>
                  <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                    <Stars rating={book.my_rating} onRate={(r) => handleRate(book.id, r)} />
                  </div>
                  {book.date_read && <p className="text-[10px] text-[#b0aea5] mt-1">{book.date_read}</p>}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="brand-btn px-4 py-2 bg-white border border-[#e8e6dc] text-[#b0aea5] text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#b0aea5]">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="brand-btn px-4 py-2 bg-white border border-[#e8e6dc] text-[#b0aea5] text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e6dc]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{fontFamily: 'var(--font-heading)'}}>Add a Book</h2>
                <button onClick={() => setShowAddModal(false)} className="text-[#b0aea5] hover:text-[#141413] text-xl">&times;</button>
              </div>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={addSearch}
                onChange={(e) => {
                  setAddSearch(e.target.value);
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  searchTimeoutRef.current = setTimeout(() => searchExternalBooks(e.target.value), 400);
                }}
                className="brand-input w-full"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
              {addLoading && <p className="text-center text-[#b0aea5] py-4">Searching...</p>}
              {!addLoading && addResults.length === 0 && addSearch.length >= 2 && (
                <p className="text-center text-[#b0aea5] py-4">No results found</p>
              )}
              {addResults.map((book, i) => (
                <div key={book.key || i} className="flex items-start gap-4 p-3 border border-[#e8e6dc] rounded-lg hover:bg-[#faf9f5]">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-12 rounded object-cover shrink-0" style={{height: 72}} />
                  ) : (
                    <div className="w-12 rounded bg-[#e8e6dc] shrink-0 flex items-center justify-center text-[#b0aea5] text-xs" style={{height: 72}}>No cover</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#141413] truncate">{book.title}</h3>
                    <p className="text-xs text-[#b0aea5]">{book.author || 'Unknown'} {book.year ? `(${book.year})` : ''} {book.pages ? `- ${book.pages} pg` : ''}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleAddBook(book, 'read')} className="brand-btn px-3 py-1.5 bg-[#d97757] text-white text-xs">Read</button>
                    <button onClick={() => handleAddBook(book, 'to-read')} className="brand-btn px-3 py-1.5 bg-[#788c5d] text-white text-xs">To Read</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Synopsis Modal */}
      {synopsisBook && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSynopsisBook(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex gap-5">
                <BookCover coverUrl={synopsisBook.cover_url} title={synopsisBook.title} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-bold text-[#141413] leading-tight" style={{fontFamily: 'var(--font-heading)'}}>{synopsisBook.title}</h2>
                    <button onClick={() => setSynopsisBook(null)} className="text-[#b0aea5] hover:text-[#141413] text-xl ml-2 shrink-0">&times;</button>
                  </div>
                  <p className="text-sm text-[#b0aea5] mt-1">{synopsisBook.author || 'Unknown author'}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#b0aea5]">
                    {synopsisBook.num_pages && <span>{synopsisBook.num_pages} pages</span>}
                    {synopsisBook.original_year && <span>Published {synopsisBook.original_year}</span>}
                    {synopsisBook.date_read && <span>Read {synopsisBook.date_read}</span>}
                  </div>
                  <div className="mt-3" onClick={e => e.stopPropagation()}>
                    <Stars rating={synopsisBook.my_rating} onRate={(r) => {
                      handleRate(synopsisBook.id, r);
                      setSynopsisBook({...synopsisBook, my_rating: r});
                    }} />
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-[#e8e6dc]">
                <h3 className="text-xs font-semibold text-[#b0aea5] uppercase tracking-wider mb-2" style={{fontFamily: 'var(--font-heading)'}}>Synopsis</h3>
                {synopsisLoading ? (
                  <p className="text-sm text-[#b0aea5] italic">Loading synopsis from Open Library...</p>
                ) : (
                  <p className="text-sm text-[#141413] leading-relaxed whitespace-pre-line">{synopsisText}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
