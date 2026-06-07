'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

interface Props {
  score: number;
  prevBest: number | null;
}

/**
 * Shown on the session complete page when the user achieves a new personal best.
 * Animates in after a short delay so it doesn't appear immediately with the page.
 */
export function PersonalBestBanner({ score, prevBest }: Props) {
  const isNewBest = prevBest === null || score > prevBest;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNewBest) return;
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [isNewBest]);

  if (!isNewBest || !visible) return null;

  const isFirst = prevBest === null;

  return (
    <div className="animate-in fade-in slide-in-from-top-3 duration-500 mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
        <Trophy className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {isFirst ? '🎉 First session complete!' : `🏆 New personal best — ${score.toFixed(1)}/5`}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFirst
            ? 'Your baseline is set. Every session from here is progress.'
            : `Previous best: ${prevBest!.toFixed(1)}/5 — up ${(score - prevBest!).toFixed(1)} points`}
        </p>
      </div>
    </div>
  );
}
