'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 w-9 h-9" /> // Placeholder to prevent layout shift
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg border border-purple-400/30 transition-all ${
        theme === 'dark'
          ? 'text-slate-400 hover:text-black/70 hover:bg-gradient-to-br hover:from-purple-100 hover:via-purple-200 hover:to-purple-300'
          : 'text-gray-600 hover:text-white hover:bg-gradient-to-br hover:from-purple-900/60 hover:via-purple-950/70 hover:to-purple-950/90'
      }`}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}
