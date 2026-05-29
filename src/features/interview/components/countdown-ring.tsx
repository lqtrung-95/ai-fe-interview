'use client';

import { useInterviewStore } from '../interview-store';

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * SVG ring countdown timer for the interview answering phase.
 * Renders nothing when the timer is disabled (timerSeconds === 0).
 *
 * Color states:
 *   green  → normal (more than 30 s remaining)
 *   amber  → warning (≤ 30 s)
 *   red    → urgent (≤ 10 s)
 */
export function CountdownRing() {
  const timerSeconds = useInterviewStore((s) => s.timerSeconds);
  const timeLeft = useInterviewStore((s) => s.timeLeft);
  const timerActive = useInterviewStore((s) => s.timerActive);

  // Hidden when timer is disabled or hasn't been initialised yet
  if (timerSeconds === 0 || (!timerActive && timeLeft === timerSeconds)) return null;

  const fraction = timerSeconds > 0 ? timeLeft / timerSeconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const label = `${mins}:${String(secs).padStart(2, '0')}`;

  const colorClass =
    timeLeft <= 10
      ? 'stroke-red-500 text-red-500'
      : timeLeft <= 30
        ? 'stroke-amber-500 text-amber-500'
        : 'stroke-primary text-primary';

  return (
    <div className={`relative inline-flex items-center justify-center ${colorClass}`}>
      {/* -rotate-90 so the arc starts at 12 o'clock */}
      <svg width="52" height="52" className="-rotate-90" aria-hidden="true">
        {/* Background track */}
        <circle
          cx="26" cy="26" r={RADIUS}
          fill="none" strokeWidth="3"
          className="stroke-muted"
        />
        {/* Progress arc */}
        <circle
          cx="26" cy="26" r={RADIUS}
          fill="none" strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      {/* MM:SS label centred inside the ring */}
      <span className="absolute text-[11px] font-mono font-semibold tabular-nums">
        {label}
      </span>
    </div>
  );
}
