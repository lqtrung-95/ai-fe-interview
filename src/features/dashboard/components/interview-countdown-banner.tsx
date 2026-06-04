'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

interface Props {
  targetInterviewDate: string; // ISO string
}

function getDaysUntil(iso: string): number {
  const target = new Date(iso);
  target.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function InterviewCountdownBanner({ targetInterviewDate }: Props) {
  const days = getDaysUntil(targetInterviewDate);

  // Don't show if the date has already passed
  if (days < 0) return null;

  const label = days === 0 ? 'Today!' : days === 1 ? '1 day to go' : `${days} days to go`;

  const urgency =
    days <= 3 ? 'border-destructive/30 bg-destructive/8 text-destructive' :
    days <= 7 ? 'border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400' :
    'border-primary/25 bg-primary/8 text-primary';

  const date = new Date(targetInterviewDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${urgency}`}>
      <div className="flex items-center gap-3">
        <CalendarDays className="size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs opacity-75">Interview on {date}</p>
        </div>
      </div>
      <Link
        href="/settings"
        className="shrink-0 text-xs opacity-60 hover:opacity-100 transition-opacity"
      >
        Edit
      </Link>
    </div>
  );
}
