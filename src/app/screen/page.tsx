'use client';

import { useEffect, useState, useCallback } from 'react';

type Book = {
  id: number;
  title: string;
  author: string | null;
  my_rating: number;
  num_pages: number | null;
  date_read: string | null;
  shelf: string;
  source: string;
};

export default function ScreenPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [shelf, setShelf] = useState('all');
  const [sort, setSort] = useState('title');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);
  const perPage = 50;

  const fetchBooks = useCallback(() => {
    const params = new URLSearchParams({
      sort, order,
      limit: String(perPage),
      offset: String(page * perPage),
    });
    if (shelf !== 'all') params.set('shelf', shelf);
    if (search) params.set('search', search);
    fetch(`/api/books?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setBooks(data.books);
        setTotal(data.total);
      });
  }, [shelf, search, sort, order, page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => { setPage(0); }, [shelf, search, sort, order]);

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      books.forEach((b) => {
        if (checked) next.add(b.id);
        else next.delete(b.id);
      });
      return next;
    });
  };

  const handleRemove = async () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove ${selected.size} books from your library?`
    );
    if (!confirmed) return;

    const res = await fetch('/api/books/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const data = await res.json();
    if (data.deleted) {
      setRemovedCount((prev) => prev + data.deleted);
      setSelected(new Set());
      fetchBooks();
    }
  };

  const totalPages = Math.ceil(total / perPage);
  const pageAllSelected = books.length > 0 && books.every((b) => selected.has(b.id));

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <header className="bg-white border-b border-[#e8e6dc] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d97757]" style={{fontFamily: 'var(--font-heading)'}}>Remove Books</h1>
            <p className="text-sm text-[#b0aea5]">
              {selected.size > 0
                ? `${selected.size} selected for removal`
                : `${total} books shown`}
              {removedCount > 0 && (
                <span className="text-[#788c5d] ml-2">({removedCount} removed so far)</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="brand-btn px-4 py-2 bg-white border border-[#e8e6dc] text-[#141413] text-sm">Dashboard</a>
            <a href="/recommendations" className="brand-btn px-4 py-2 bg-[#788c5d] text-white text-sm">Recommendations</a>
            {selected.size > 0 && (
              <button
                onClick={handleRemove}
                className="brand-btn px-4 py-2 bg-[#d97757] text-white text-sm"
              >
                Remove {selected.size} Books
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search books or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="brand-input px-4 py-2 text-sm w-64"
          />
          <select
            value={shelf}
            onChange={(e) => setShelf(e.target.value)}
            className="brand-select px-3 py-2 text-sm"
          >
            <option value="all">All Shelves</option>
            <option value="read">Read</option>
            <option value="currently-reading">Currently Reading</option>
            <option value="to-read">To Read</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="brand-select px-3 py-2 text-sm"
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="date_read">Date Read</option>
            <option value="num_pages">Pages</option>
            <option value="my_rating">Rating</option>
          </select>
          <button
            onClick={() => setOrder(order === 'DESC' ? 'ASC' : 'DESC')}
            className="brand-btn px-3 py-2 bg-white border border-[#e8e6dc] text-[#b0aea5] text-sm"
          >
            {order === 'DESC' ? '\u2193 Desc' : '\u2191 Asc'}
          </button>
        </div>

        {/* Book Table */}
        <div className="brand-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#faf9f5] border-b border-[#e8e6dc]">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    onChange={(e) => togglePage(e.target.checked)}
                    className="w-4 h-4 accent-[#d97757]"
                    title="Select all on this page"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs text-[#b0aea5] uppercase tracking-wider" style={{fontFamily: 'var(--font-heading)'}}>Title</th>
                <th className="text-left px-4 py-3 text-xs text-[#b0aea5] uppercase tracking-wider" style={{fontFamily: 'var(--font-heading)'}}>Author</th>
                <th className="text-center px-4 py-3 text-xs text-[#b0aea5] uppercase tracking-wider" style={{fontFamily: 'var(--font-heading)'}}>Pages</th>
                <th className="text-left px-4 py-3 text-xs text-[#b0aea5] uppercase tracking-wider" style={{fontFamily: 'var(--font-heading)'}}>Shelf</th>
                <th className="text-left px-4 py-3 text-xs text-[#b0aea5] uppercase tracking-wider" style={{fontFamily: 'var(--font-heading)'}}>Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6dc]">
              {books.map((book) => (
                <tr
                  key={book.id}
                  className={`hover:bg-[#faf9f5] transition cursor-pointer ${
                    selected.has(book.id) ? 'bg-[#d97757]/5' : 'bg-white'
                  }`}
                  onClick={() => toggleOne(book.id)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(book.id)}
                      onChange={() => toggleOne(book.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-[#d97757]"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-[#141413] max-w-xs truncate">
                    {book.title}
                  </td>
                  <td className="px-4 py-3 text-[#b0aea5]">{book.author || '-'}</td>
                  <td className="px-4 py-3 text-center text-[#b0aea5]">{book.num_pages || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      book.shelf === 'read'
                        ? 'bg-[#788c5d]/10 text-[#788c5d] border-[#788c5d]/20'
                        : book.shelf === 'currently-reading'
                        ? 'bg-[#6a9bcc]/10 text-[#6a9bcc] border-[#6a9bcc]/20'
                        : 'bg-[#e8e6dc] text-[#b0aea5] border-[#e8e6dc]'
                    }`}>
                      {book.shelf}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      book.source === 'goodreads' ? 'bg-[#d97757]/10 text-[#d97757] border-[#d97757]/20' : 'bg-[#6a9bcc]/10 text-[#6a9bcc] border-[#6a9bcc]/20'
                    }`}>
                      {book.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Spacer for sticky footer */}
        {totalPages > 1 && <div className="h-16" />}
      </main>

      {/* Sticky Pagination */}
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e6dc] z-10 shadow-lg">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-center gap-3">
            <button
              onClick={() => { setPage(Math.max(0, page - 1)); window.scrollTo(0, 0); }}
              disabled={page === 0}
              className="brand-btn px-5 py-2.5 bg-white border border-[#e8e6dc] text-[#b0aea5] text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &larr; Previous
            </button>
            <span className="text-sm font-bold text-[#141413] px-3">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => { setPage(Math.min(totalPages - 1, page + 1)); window.scrollTo(0, 0); }}
              disabled={page >= totalPages - 1}
              className="brand-btn px-5 py-2.5 bg-white border border-[#e8e6dc] text-[#b0aea5] text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
