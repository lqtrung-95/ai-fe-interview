'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ResourceSearchOverlay } from './resource-search-overlay';

/**
 * Mounts the cross-resource search: a ⌘K / Ctrl+K listener plus a discoverable
 * floating button (the entry point on mobile, where there is no shortcut).
 * Native ⌘F is intentionally left alone for in-page find.
 */
export function ResourceSearchLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search resources"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/95 px-4 py-2.5 text-sm text-muted-foreground shadow-lg backdrop-blur transition-colors hover:border-primary/40 hover:text-primary print:hidden"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border/60 px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>
      <ResourceSearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
