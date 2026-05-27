'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** Epoch ms — when the rate limit lifts. */
  until: number;
  onExpire?: () => void;
}

/**
 * Sticky banner shown while a server-side rate limit is active.
 * Self-disposes when the cooldown elapses.
 */
export function RateLimitBanner({ until, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => Math.max(0, until - Date.now()));

  useEffect(() => {
    if (until <= Date.now()) {
      onExpire?.();
      return;
    }
    const tick = () => {
      const left = until - Date.now();
      setRemaining(left);
      if (left <= 0) {
        onExpire?.();
        clearInterval(id);
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [until, onExpire]);

  if (remaining <= 0) return null;
  const seconds = Math.ceil(remaining / 1000);
  const display = seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds}s`;

  return (
    <div
      role="status"
      className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <p className="font-medium text-amber-900 dark:text-amber-100">Slow down a sec — rate limit hit.</p>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
        Try again in {display}. Your answer is saved; nothing is lost.
      </p>
    </div>
  );
}
