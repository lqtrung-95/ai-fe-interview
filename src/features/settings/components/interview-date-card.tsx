'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { dashboardKeys } from '@/lib/query/keys';
import { updateInterviewDateAction } from '../server/update-interview-date-action';

interface Props {
  initialDate: string | null; // ISO string or null
}

export function InterviewDateCard({ initialDate }: Props) {
  // Store as yyyy-MM-dd for the <input type="date"> value
  const toInputValue = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 10) : '';

  const [value, setValue] = useState(toInputValue(initialDate));
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await updateInterviewDateAction(value || null);
      // Bust React Query's 30-min stale cache so the dashboard banner
      // reflects the new date immediately without a manual refresh.
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
      setSaved(true);
    });
  }

  function handleClear() {
    setValue('');
    startTransition(async () => {
      await updateInterviewDateAction(null);
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
      setSaved(false);
    });
  }

  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
          <CalendarDays className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-bold">Interview date</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Set your interview date and we&apos;ll show a countdown on your dashboard.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={value}
          onChange={handleChange}
          min={new Date().toISOString().slice(0, 10)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !value}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
}
