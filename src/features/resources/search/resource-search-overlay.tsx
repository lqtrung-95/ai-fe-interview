'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { ResourceSearchRecord } from './resource-search-types';
import { searchResources, tokenize } from './resource-search-engine';

/** Wrap query-token matches in <mark> for visual highlight. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return <>{text}</>;
  const alternation = tokens.map(escapeRegExp).join('|');
  // split keeps captured delimiters; a separate anchored (non-global) tester
  // avoids the stateful lastIndex bug of reusing a /g/ regex with .test().
  const splitter = new RegExp(`(${alternation})`, 'gi');
  const isMatch = new RegExp(`^(?:${alternation})$`, 'i');
  const parts = text.split(splitter);
  return (
    <>
      {parts.map((part, i) =>
        isMatch.test(part) ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function ResourceSearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [records, setRecords] = useState<ResourceSearchRecord[] | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-fetch the static index only the first time the overlay opens.
  useEffect(() => {
    if (open && records === null) {
      fetch('/resources-search-index.json')
        .then((r) => r.json())
        .then((data: ResourceSearchRecord[]) => setRecords(data))
        .catch((err) => console.error('[resource-search] index load failed', err));
    }
  }, [open, records]);

  // Reset transient state when the overlay transitions to open — done during
  // render (React re-renders immediately) rather than in an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setActive(0);
    }
  }

  // Focus the input shortly after opening (DOM side-effect only — no setState).
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(
    () => (records ? searchResources(records, query) : []),
    [records, query],
  );

  if (!open) return null;

  function go(url: string) {
    onClose();
    router.push(url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active].record.url);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search resources"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search all resources…"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {records === null && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {records !== null && query.trim() !== '' && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for “{query}”.
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={r.record.url + i}
              onClick={() => go(r.record.url)}
              onMouseMove={() => setActive(i)}
              className={`flex w-full flex-col gap-1 border-b border-border/30 px-4 py-3 text-left last:border-b-0 ${
                i === active ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                  {r.record.handbookTitle}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  <Highlighted text={r.record.sectionTitle} query={query} />
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                <Highlighted text={r.snippet} query={query} />
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
