'use client';

/**
 * CSS 3D flip flashcard grid.
 * Each card flips independently on click — no JS animation library needed.
 * Uses inline styles for 3D transforms (perspective, transformStyle,
 * backfaceVisibility) since Tailwind v4 doesn't ship these utilities.
 */

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardItem {
  front: string;
  back: string;
}

interface Props {
  items: FlashcardItem[];
}

export function HandbookFlashcardDeck({ items }: Props) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const flippedCount = flipped.size;

  return (
    <div className="my-7 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
            Flashcards
          </span>
          <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground/70">
            {items.length}
          </span>
        </div>
        {flippedCount > 0 && (
          <button
            onClick={() => setFlipped(new Set())}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        )}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, i) => {
          const isFlipped = flipped.has(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={cn(
                'relative h-40 cursor-pointer text-left rounded-xl',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              )}
              style={{ perspective: '1000px' }}
              aria-label={isFlipped ? 'Click to flip back' : 'Click to reveal answer'}
            >
              {/* Inner wrapper — rotates on flip */}
              <div
                className="relative w-full h-full transition-transform duration-500 ease-in-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front face */}
                <div
                  className="absolute inset-0 rounded-xl border border-border/60 bg-card p-4 flex flex-col justify-between gap-2"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-4 flex-1">
                    {item.front}
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                    Click to reveal →
                  </span>
                </div>

                {/* Back face — primary-tinted with slightly stronger bg */}
                <div
                  className="absolute inset-0 rounded-xl border border-primary/30 bg-primary/10 p-4 flex flex-col justify-center gap-1"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <p className="text-sm text-foreground leading-relaxed line-clamp-5">
                    {item.back}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
