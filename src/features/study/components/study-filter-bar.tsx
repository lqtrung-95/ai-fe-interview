'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

const DIFFICULTIES = [
  { value: '', label: 'All levels' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
] as const;

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'conceptual', label: 'Conceptual' },
  { value: 'debugging', label: 'Debugging' },
  { value: 'system_design', label: 'System design' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'tradeoff', label: 'Trade-off' },
] as const;

interface Props {
  topics: string[];
  totalCount: number;
  filteredCount: number;
}

export function StudyFilterBar({ topics, totalCount, filteredCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  const activeTopic = params.get('topic') ?? '';
  const activeDiff = params.get('difficulty') ?? '';
  const activeType = params.get('type') ?? '';

  return (
    <div className="space-y-4">
      {/* Topics */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Topic</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => update('topic', '')}
            className={chip(activeTopic === '')}
          >
            All topics
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => update('topic', t)}
              className={chip(activeTopic === t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty + Type row */}
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Difficulty</p>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => update('difficulty', d.value)}
                className={chip(activeDiff === d.value, 'sm')}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((tp) => (
              <button
                key={tp.value}
                onClick={() => update('type', tp.value)}
                className={chip(activeType === tp.value, 'sm')}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount} questions`
          : `${filteredCount} of ${totalCount} questions`}
      </p>
    </div>
  );
}

function chip(active: boolean, size: 'sm' | 'md' = 'md') {
  const base =
    'rounded-full border font-medium transition-colors cursor-pointer whitespace-nowrap ' +
    (size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm');
  return active
    ? base + ' border-primary bg-primary/10 text-primary'
    : base + ' border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground';
}
