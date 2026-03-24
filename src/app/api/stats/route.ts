import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

function computeStreaks(months: { month: string }[]) {
  if (months.length === 0) return { current: 0, longest: 0 };
  let longest = 1, current = 1;
  for (let i = 1; i < months.length; i++) {
    const [prevY, prevM] = months[i - 1].month.split('-').map(Number);
    const [curY, curM] = months[i].month.split('-').map(Number);
    const prevTotal = prevY * 12 + prevM;
    const curTotal = curY * 12 + curM;
    if (curTotal - prevTotal === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return { current, longest };
}

export async function GET() {
  const db = getDb();

  const totalBooks = db.prepare("SELECT COUNT(*) as count FROM books WHERE shelf = 'read'").get() as { count: number };
  const totalPages = db.prepare("SELECT COALESCE(SUM(num_pages), 0) as total FROM books WHERE shelf = 'read' AND num_pages IS NOT NULL").get() as { total: number };
  const avgRating = db.prepare("SELECT ROUND(AVG(my_rating), 1) as avg FROM books WHERE shelf = 'read' AND my_rating > 0").get() as { avg: number };
  const currentlyReading = db.prepare("SELECT COUNT(*) as count FROM books WHERE shelf = 'currently-reading'").get() as { count: number };
  const toRead = db.prepare("SELECT COUNT(*) as count FROM books WHERE shelf = 'to-read'").get() as { count: number };

  // Books per year
  const booksPerYear = db.prepare(`
    SELECT substr(date_read, 1, 4) as year, COUNT(*) as count
    FROM books
    WHERE shelf = 'read' AND date_read IS NOT NULL AND date_read != ''
    GROUP BY year
    ORDER BY year
  `).all();

  // Top authors
  const topAuthors = db.prepare(`
    SELECT author, COUNT(*) as count
    FROM books
    WHERE shelf = 'read' AND author IS NOT NULL AND author != ''
    GROUP BY author
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // Rating distribution
  const ratingDist = db.prepare(`
    SELECT my_rating as rating, COUNT(*) as count
    FROM books
    WHERE shelf = 'read' AND my_rating > 0
    GROUP BY my_rating
    ORDER BY my_rating
  `).all();

  // Books per month (last 2 years)
  const booksPerMonth = db.prepare(`
    SELECT substr(date_read, 1, 7) as month, COUNT(*) as count
    FROM books
    WHERE shelf = 'read' AND date_read IS NOT NULL AND date_read >= '2024-01'
    GROUP BY month
    ORDER BY month
  `).all();

  // Pages per year
  const pagesPerYear = db.prepare(`
    SELECT substr(date_read, 1, 4) as year, COALESCE(SUM(num_pages), 0) as pages
    FROM books
    WHERE shelf = 'read' AND date_read IS NOT NULL AND num_pages IS NOT NULL
    GROUP BY year
    ORDER BY year
  `).all();

  // Top rated books
  const topRated = db.prepare(`
    SELECT title, author, my_rating, avg_rating, num_pages, date_read
    FROM books
    WHERE shelf = 'read' AND my_rating = 5
    ORDER BY date_read DESC
    LIMIT 10
  `).all();

  // Longest books
  const longestBooks = db.prepare(`
    SELECT title, author, num_pages, my_rating, date_read
    FROM books
    WHERE shelf = 'read' AND num_pages IS NOT NULL
    ORDER BY num_pages DESC
    LIMIT 10
  `).all();

  // Source breakdown
  const sourceBreakdown = db.prepare(`
    SELECT source, COUNT(*) as count
    FROM books
    GROUP BY source
  `).all();

  // Genre/binding breakdown
  const bindingBreakdown = db.prepare(`
    SELECT COALESCE(binding, 'Unknown') as format, COUNT(*) as count
    FROM books
    WHERE shelf = 'read'
    GROUP BY format
    ORDER BY count DESC
  `).all();

  // Monthly heatmap (all-time)
  const monthlyHeatmap = db.prepare(`
    SELECT substr(date_read, 1, 4) as year, CAST(substr(date_read, 6, 2) AS INTEGER) as month, COUNT(*) as count
    FROM books
    WHERE shelf = 'read' AND date_read IS NOT NULL AND length(date_read) >= 7
    GROUP BY year, month
    ORDER BY year, month
  `).all();

  // Decade distribution
  const decadeDistribution = db.prepare(`
    SELECT (original_year / 10) * 10 as decade, COUNT(*) as count
    FROM books
    WHERE shelf = 'read' AND original_year IS NOT NULL
    GROUP BY decade
    ORDER BY decade
  `).all();

  // Rating trend by year
  const ratingTrend = db.prepare(`
    SELECT substr(date_read, 1, 4) as year, ROUND(AVG(my_rating), 1) as avg_rating
    FROM books
    WHERE shelf = 'read' AND my_rating > 0 AND date_read IS NOT NULL
    GROUP BY year
    ORDER BY year
  `).all();

  // Avg book length trend
  const avgLengthTrend = db.prepare(`
    SELECT substr(date_read, 1, 4) as year, ROUND(AVG(num_pages)) as avg_pages
    FROM books
    WHERE shelf = 'read' AND num_pages IS NOT NULL AND date_read IS NOT NULL
    GROUP BY year
    ORDER BY year
  `).all();

  // Unique authors
  const uniqueAuthorsResult = db.prepare("SELECT COUNT(DISTINCT author) as count FROM books WHERE shelf = 'read' AND author IS NOT NULL").get() as { count: number };

  // Reading streak (consecutive months with at least 1 book read)
  const readMonths = db.prepare(`
    SELECT DISTINCT substr(date_read, 1, 7) as month
    FROM books
    WHERE shelf = 'read' AND date_read IS NOT NULL AND length(date_read) >= 7
    ORDER BY month
  `).all() as { month: string }[];

  const readingStreak = computeStreaks(readMonths);

  // Reading pace
  const readingPace = db.prepare(`
    SELECT ROUND(AVG(gap)) as avg_days FROM (
      SELECT julianday(date_read) - julianday(LAG(date_read) OVER (ORDER BY date_read)) as gap
      FROM books
      WHERE shelf = 'read' AND date_read IS NOT NULL
      ORDER BY date_read
    ) WHERE gap IS NOT NULL AND gap > 0
  `).get() as { avg_days: number } | undefined;

  return NextResponse.json({
    summary: {
      totalBooks: totalBooks.count,
      totalPages: totalPages.total,
      avgRating: avgRating.avg || 0,
      currentlyReading: currentlyReading.count,
      toRead: toRead.count,
    },
    booksPerYear,
    topAuthors,
    ratingDist,
    booksPerMonth,
    pagesPerYear,
    topRated,
    longestBooks,
    sourceBreakdown,
    bindingBreakdown,
    monthlyHeatmap,
    decadeDistribution,
    ratingTrend,
    avgLengthTrend,
    uniqueAuthors: uniqueAuthorsResult.count,
    readingStreak,
    readingPace: readingPace?.avg_days ? Math.round(readingPace.avg_days) : null,
  });
}
