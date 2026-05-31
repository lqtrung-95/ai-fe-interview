'use client';

/**
 * Client-side glossary browser.
 * All filtering (search + category) is local — no API calls.
 * A-Z jump links scroll to the correct letter group.
 */

import { useMemo, useState, useRef } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlossaryEntry, GlossaryCategory } from '@/data/resources/glossary-types';

interface Props {
  entries: GlossaryEntry[];
  categories: GlossaryCategory[];
}

const CATEGORY_COLORS: Record<GlossaryCategory, string> = {
  'Performance':      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Rendering':        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Networking':       'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'JavaScript':       'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  'Browser':          'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'State Management': 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  'Architecture':     'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'Testing':          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Accessibility':    'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  'Security':         'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  'Build & Tooling':  'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
};

export function GlossaryClient({ entries, categories }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter entries
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return entries.filter(e => {
      const matchCat = !activeCategory || e.category === activeCategory;
      const matchQ = !q || (
        e.term.toLowerCase().includes(q) ||
        (e.abbr?.toLowerCase().includes(q) ?? false) ||
        e.definition.toLowerCase().includes(q)
      );
      return matchCat && matchQ;
    });
  }, [entries, query, activeCategory]);

  // Group by first letter
  const groups = useMemo(() => {
    const map = new Map<string, GlossaryEntry[]>();
    for (const e of filtered) {
      const letter = e.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const letters = groups.map(([l]) => l);

  function scrollToLetter(letter: string) {
    document.getElementById(`glossary-letter-${letter}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  const hasFilters = query || activeCategory;

  return (
    <div className="space-y-6">
      {/* Search + category filters */}
      <div className="space-y-3 sticky top-14 z-10 bg-background/95 backdrop-blur-sm pb-4 pt-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search terms, abbreviations, definitions…"
            className="w-full rounded-xl border border-border/60 bg-card/60 py-2.5 pl-9 pr-9 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium border transition-colors',
              !activeCategory
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
            )}
          >
            All <span className="ml-1 opacity-60">{entries.length}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium border transition-colors',
                activeCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : 'text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* A-Z jump nav — only shown when not searching */}
      {!hasFilters && letters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {letters.map(l => (
            <button
              key={l}
              onClick={() => scrollToLetter(l)}
              className="h-7 w-7 rounded-md text-xs font-mono font-semibold text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Results count when filtering */}
      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
          {query && <> matching <span className="font-mono text-foreground/80">"{query}"</span></>}
        </p>
      )}

      {/* Grouped entries */}
      {groups.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          No terms found. Try a different search or category.
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(([letter, items]) => (
            <div key={letter} id={`glossary-letter-${letter}`} className="scroll-mt-40">
              {/* Letter heading */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold font-mono text-foreground/20 w-7 shrink-0">
                  {letter}
                </span>
                <span className="h-px flex-1 bg-border/40" />
              </div>

              {/* Term cards */}
              <div className="space-y-2 ml-10">
                {items.map(entry => (
                  <div
                    key={entry.term}
                    className="group rounded-xl border border-border/50 bg-card/40 px-5 py-4 hover:border-border hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Term + abbreviation */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{entry.term}</h3>
                        {entry.abbr && (
                          <span className="text-[11px] font-mono text-primary/70 bg-primary/8 rounded px-1.5 py-0.5 border border-primary/15">
                            {entry.abbr}
                          </span>
                        )}
                      </div>

                      {/* Category + handbook link */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-medium border',
                            CATEGORY_COLORS[entry.category],
                          )}
                        >
                          {entry.category}
                        </span>
                        {entry.handbookId && (
                          <a
                            href={`/resources/frontend-system-design#${entry.handbookId}`}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                          >
                            <BookOpen className="h-3 w-3" />
                            Handbook
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {entry.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
