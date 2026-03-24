import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();

  // Get all read books with covers
  const books = db.prepare(`
    SELECT id, title, author, my_rating, num_pages, date_read, original_year, cover_url, review
    FROM books WHERE shelf = 'read'
    ORDER BY date_read DESC
  `).all();

  // Define category mappings based on known authors/titles
  const categories: Record<string, { color: string; authors: string[]; titlePatterns: string[] }> = {
    'Sci-Fi': {
      color: '#6a9bcc',
      authors: ['Liu Cixin', 'Isaac Asimov', 'Frank Herbert', 'Andy Weir', 'Neal Stephenson', 'Dan Simmons', 'Joe Haldeman', 'Hugh Howey', 'Arthur C. Clarke', 'Orson Scott Card', 'Martha Wells', 'Peter F. Hamilton', 'Michael Crichton', 'Chuck Wendig', 'Aldous Huxley', 'George Orwell', 'Blake Crouch', 'Hiroshi Sakurazaka', 'Mary Wollstonecraft Shelley'],
      titlePatterns: ['Three-Body', 'Dune', 'Foundation', 'Hail Mary', 'Seveneves', 'Hyperion', 'Forever War', "Ender's", 'Snow Crash', 'Dark Matter', 'Brave New World', '1984', 'Andromeda', 'Wool', 'Wanderers', 'Murderbot', 'Rendezvous with Rama', 'Pandora\'s Star']
    },
    'Literary Fiction': {
      color: '#d97757',
      authors: ['Cormac McCarthy', 'John Steinbeck', 'Herman Melville', 'Jeffrey Eugenides', 'Hanya Yanagihara', 'Jonathan Franzen', 'John Irving', 'David Foster Wallace', 'Paul Beatty', 'Kazuo Ishiguro', 'Michael Chabon', 'Carlos Ruiz Zafon', 'Amor Towles', 'Min Jin Lee', 'Hermann Hesse', 'Delia Owens', 'Anthony Doerr', 'Alexandre Dumas', 'Chad Harbach', 'Viktor E. Frankl', 'Laurie Frankel', 'Norman Mailer', 'Fredrik Backman', 'J.D. Salinger', 'Yann Martel', 'John Banville', 'Leo Tolstoy', 'Paulo Coelho', 'Miranda Cowley Heller', 'Olga Tokarczuk', 'Roald Dahl', 'William Golding'],
      titlePatterns: ['Blood Meridian', 'East of Eden', 'Moby', 'Middlesex', 'Little Life', 'Infinite Jest', 'Crossroads', 'Remains of the Day', 'Count of Monte', 'Pachinko', 'Siddhartha', 'Shadow of the Wind', 'Gentleman in Moscow', 'Rules of Civility', 'Lord of the Flies', 'Kavalier', 'Art of Fielding', 'Anna Karenina', 'Cloud Cuckoo', 'Where the Crawdads', 'Paper Palace', 'Alchemist', 'Executioner\'s Song', 'What Makes Sammy']
    },
    'Narrative Non-Fiction': {
      color: '#788c5d',
      authors: ['Erik Larson', 'David Halberstam', 'Laura Hillenbrand', 'Daniel James Brown', 'Jon Krakauer', 'David McCullough', 'Stephen E. Ambrose', 'Nathaniel Philbrick', 'David Grann', 'Cornelius Ryan', 'Gilbert King', 'Neal Bascomb', 'Tim Weiner', 'Ben R. Rich', 'Bill Vlasic', 'Peter Hessler', 'Isabel Wilkerson', 'Douglas Preston', 'T.J. Stiles', 'Patrick Leigh Fermor', 'Stephen Graham'],
      titlePatterns: ['Devil in the White City', 'Unbroken', 'Boys in the Boat', 'In the Heart of the Sea', 'Coldest Winter', 'Legacy of Ashes', 'Undaunted Courage', 'Skunk Works', 'Hunting Eichmann', 'Wager', 'Splendid', 'Empire of the Summer Moon', 'Killers of the Flower', 'Lost City of the Monkey', 'Freedom\'s Forge', 'Buffalo Hunter', 'Time of Gifts']
    },
    'Espionage & Thriller': {
      color: '#b07d62',
      authors: ['John le Carr', 'Robert Galbraith', 'Caleb Carr', 'Agatha Christie', 'Alex Michaelides', 'Gillian Flynn', 'Paula Hawkins', 'Dashiell Hammett', 'George V. Higgins', 'Nic Pizzolatto', 'Frederick Forsyth', 'Holly Jackson', 'Juan G'],
      titlePatterns: ['Spy Who Came', 'Smiley', 'Alienist', 'Silent Patient', 'Gone Girl', 'Girl on the Train', 'Murder of Roger', 'Maltese Falcon', 'Cormoran Strike', 'Silkworm', 'Friends of Eddie', 'Red Queen']
    },
    'Biography & Science': {
      color: '#9b8ec4',
      authors: ['Richard P. Feynman', 'Christopher Sykes', 'James Gleick', 'Siddhartha Mukherjee', 'Steven Pinker', 'Walter Isaacson', 'Ashlee Vance', 'Malcolm Gladwell', 'Michael Pollan', 'Hans Rosling', 'Brian Greene', 'Steven D. Levitt', 'Michael Lewis', 'Matt Ridley', 'David Sinclair', 'Dan Flores'],
      titlePatterns: ['Feynman', 'Emperor of All Maladies', 'Better Angels', 'Elon Musk', 'Genius', 'Chaos', 'MANIAC', 'Elegant Universe', 'Moneyball', 'Blink', 'Outliers', 'Factfulness', 'How to Change Your Mind', 'Cease to Understand', 'Red Queen', 'Lifespan', 'Coyote America']
    },
    'Endurance & Self': {
      color: '#c45b48',
      authors: ['Christopher McDougall', 'Ed Caesar', 'David Goggins', 'Rich Roll', 'Ryan Holiday', 'Jen Sincero', 'Anna Lembke', 'Jocko Willink', 'William Porter', 'Terrence Real', 'Matthew  Perry'],
      titlePatterns: ['Born to Run', 'Two Hours', "Can't Hurt Me", 'Finding Ultra', 'Ego Is the Enemy', 'Badass', 'Dopamine Nation', 'Extreme Ownership', 'Blind Side', 'Breaks of the Game', 'Alcohol Explained', "Don't Want to Talk"]
    },
    'Historical & Epic Fiction': {
      color: '#c4a03e',
      authors: ['James Clavell', 'J.R.R. Tolkien', 'George R.R. Martin', 'Neil Gaiman', 'Suzanne Collins', 'Steven Pressfield', 'Budd Schulberg', 'Haruki Murakami', 'Khaled Hosseini', 'Garth Ennis', 'Frank Miller', 'Rebecca Yarros'],
      titlePatterns: ['Shogun', 'Hobbit', 'Lord of the Rings', 'Game of Thrones', 'Song of Ice', 'American Gods', 'Hunger Games', 'Gates of Fire', 'Kite Runner', 'Preacher', 'Batman', 'Dark Knight', 'Fourth Wing']
    },
    'Finance & Business': {
      color: '#5a8a7a',
      authors: ['Warren Buffett', 'Joel Greenblatt', 'William Poundstone', 'Roger Lowenstein', 'Nassim Nicholas Taleb', 'Jack D. Schwager', 'Edwin Lefevre', 'Mark Robichaux', 'Daniel Ammann', 'Atul Gawande'],
      titlePatterns: ["Fortune's Formula", 'When Genius Failed', 'Stock Market', 'Buffett', 'Cable Cowboy', "Liar's Poker", 'King of Oil', 'Fooled by Randomness', 'Complications']
    }
  };

  // Categorize each book
  type CategorizedBook = {
    id: number;
    title: string;
    author: string | null;
    my_rating: number;
    num_pages: number | null;
    date_read: string | null;
    cover_url: string | null;
    review: string | null;
    category: string;
  };

  const categorized: CategorizedBook[] = (books as any[]).map(book => {
    let cat = 'Other';
    for (const [category, config] of Object.entries(categories)) {
      if (config.authors.some(a => book.author && book.author.includes(a))) {
        cat = category;
        break;
      }
      if (config.titlePatterns.some(p => book.title && book.title.includes(p))) {
        cat = category;
        break;
      }
    }
    return { ...book, category: cat };
  });

  // Group by category
  const grouped: Record<string, CategorizedBook[]> = {};
  const categoryColors: Record<string, string> = {};
  for (const book of categorized) {
    if (!grouped[book.category]) grouped[book.category] = [];
    grouped[book.category].push(book);
    if (categories[book.category]) {
      categoryColors[book.category] = categories[book.category].color;
    }
  }
  categoryColors['Other'] = '#b0aea5';

  // Build stats per category
  const categoryStats = Object.entries(grouped).map(([name, bks]) => ({
    name,
    count: bks.length,
    avgRating:
      bks.filter(b => b.my_rating > 0).length > 0
        ? Math.round(
            (bks.filter(b => b.my_rating > 0).reduce((s, b) => s + b.my_rating, 0) /
              bks.filter(b => b.my_rating > 0).length) *
              10
          ) / 10
        : 0,
    fiveStarCount: bks.filter(b => b.my_rating === 5).length,
    color: categoryColors[name] || '#b0aea5',
    books: bks,
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json({ categoryStats, totalBooks: books.length });
}
