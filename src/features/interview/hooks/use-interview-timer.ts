'use client';

import { useEffect } from 'react';
import { useInterviewStore } from '../interview-store';

/**
 * Drives the per-question countdown timer.
 *
 * - Ticks every second while phase === 'answering' and timerActive === true.
 * - When timeLeft reaches 1, auto-submits via the provided callback before
 *   decrementing (so the answer is submitted at t=0, not before).
 * - Cleanup on unmount or when dependencies change prevents stale intervals.
 */
export function useInterviewTimer(submitAnswer: () => Promise<void>) {
  const phase = useInterviewStore((s) => s.phase);
  const timerActive = useInterviewStore((s) => s.timerActive);
  const timeLeft = useInterviewStore((s) => s.timeLeft);
  const tickTimer = useInterviewStore((s) => s.tickTimer);

  useEffect(() => {
    if (phase !== 'answering' || !timerActive || timeLeft <= 0) return;

    const id = setInterval(() => {
      if (timeLeft <= 1) {
        clearInterval(id);
        // Tick to 0:00 first so the display reaches zero regardless of whether
        // submitAnswer does anything (e.g. empty draft guard).
        tickTimer();
        void submitAnswer();
      } else {
        tickTimer();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timerActive, timeLeft, tickTimer, submitAnswer]);
}
