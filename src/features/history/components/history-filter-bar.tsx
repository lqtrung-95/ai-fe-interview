'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ONBOARDING_TOPICS } from '@/features/onboarding/schema';

const TOPICS = ['', ...ONBOARDING_TOPICS] as const;
const SCORE_OPTIONS = ['', '2', '3', '3.5', '4', '4.5'] as const;

export function HistoryFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const topic = params.get('topic') ?? '';
  const minScore = params.get('minScore') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const hasAny = topic || minScore || from || to;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(`/history?${next.toString()}`, { scroll: false });
    });
  }

  function clearAll() {
    startTransition(() => router.replace('/history', { scroll: false }));
  }

  return (
    <div
      className="grid gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      data-pending={pending ? '' : undefined}
    >
      <FilterField label="Topic">
        <select
          value={topic}
          onChange={(e) => update('topic', e.target.value)}
          className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
        >
          {TOPICS.map((t) => (
            <option key={t || 'all'} value={t}>
              {t || 'Any topic'}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Min score">
        <select
          value={minScore}
          onChange={(e) => update('minScore', e.target.value)}
          className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
        >
          {SCORE_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? `≥ ${s}` : 'Any score'}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="From">
        <input
          type="date"
          value={from}
          onChange={(e) => update('from', e.target.value)}
          className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
        />
      </FilterField>

      <FilterField label="To">
        <input
          type="date"
          value={to}
          onChange={(e) => update('to', e.target.value)}
          className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
        />
      </FilterField>

      <div className="flex items-end">
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          disabled={!hasAny || pending}
          className="w-full"
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
