'use client';

import { useEffect, useRef } from 'react';
import { useInterviewStore } from '../interview-store';

/**
 * Drives the per-question countdown timer.
 *
 * Design decisions that prevent the common bugs:
 *
 * 1. `submitAnswer` and `onExpiredEmpty` are stored in refs — their identity
 *    changing (e.g. on every keystroke) does NOT restart the interval.
 *
 * 2. `timeLeft` is read directly from the store inside the interval callback
 *    rather than being a reactive dep — this means typing in the textarea
 *    (which triggers re-renders) does NOT clear/restart the interval.
 *
 * 3. The interval only re-registers when `phase` or `timerActive` change —
 *    meaningful state transitions, not incidental re-renders.
 *
 * 4. When time expires with an empty draft `onExpiredEmpty` is called instead
 *    of silently bailing, so the session always progresses.
 */
export function useInterviewTimer(
  submitAnswer: () => Promise<void>,
  onExpiredEmpty: () => void,
) {
  const phase = useInterviewStore((s) => s.phase);
  const timerActive = useInterviewStore((s) => s.timerActive);

  // Stable refs — interval callback always sees the latest version
  // without making them reactive deps that would restart the interval.
  const submitRef = useRef(submitAnswer);
  const onExpiredEmptyRef = useRef(onExpiredEmpty);
  useEffect(() => { submitRef.current = submitAnswer; });
  useEffect(() => { onExpiredEmptyRef.current = onExpiredEmpty; });

  useEffect(() => {
    if (phase !== 'answering' || !timerActive) return;

    const id = setInterval(() => {
      // Read directly from store — avoids stale closure without adding timeLeft
      // to the dep array (which would restart the interval every second).
      const { timeLeft, draft, tickTimer, stopTimer } = useInterviewStore.getState();

      if (timeLeft <= 1) {
        clearInterval(id);
        tickTimer(); // tick to 0:00 so the display reaches zero
        stopTimer();
        if (draft.trim()) {
          void submitRef.current();       // normal submit
        } else {
          onExpiredEmptyRef.current();    // force-submit empty (AI handles timeout)
        }
      } else {
        tickTimer();
      }
    }, 1000);

    return () => clearInterval(id);
  // Only restart on meaningful transitions, NOT on every timeLeft decrement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timerActive]);
}
