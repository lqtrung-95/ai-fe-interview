'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';

interface Props {
  hints: string[];
}

export function HintsPanel({ hints }: Props) {
  const [revealed, setRevealed] = useState(0);
  const [open, setOpen] = useState(false);

  if (hints.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-3.5 w-3.5" />
          Hints ({hints.length} available)
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-amber-500/70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-amber-500/15 px-3 pb-3 pt-2.5 space-y-2.5">
          {/* Revealed hints */}
          {Array.from({ length: revealed }).map((_, i) => (
            <div key={i} className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1.5">
                Hint {i + 1}:
              </span>
              {hints[i]}
            </div>
          ))}

          {/* Reveal button */}
          {revealed < hints.length ? (
            <button
              onClick={() => setRevealed((n) => n + 1)}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {revealed === 0 ? 'Show first hint' : `Show hint ${revealed + 1} of ${hints.length}`}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground/60">All hints revealed.</p>
          )}
        </div>
      )}
    </div>
  );
}
