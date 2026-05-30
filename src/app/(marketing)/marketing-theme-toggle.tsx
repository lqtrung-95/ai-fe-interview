'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function MarketingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle color theme"
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
    >
      {mounted && resolvedTheme === 'dark'
        ? <Sun className="h-3.5 w-3.5" />
        : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
