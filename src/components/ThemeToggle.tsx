'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-sm">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
