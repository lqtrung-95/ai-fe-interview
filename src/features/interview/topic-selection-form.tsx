'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { createSession } from './server/create-session-action';
import {
  SESSION_MODES,
  SESSION_DIFFICULTIES,
  type CreateSessionInput,
} from './session-config-schema';
import { ONBOARDING_TOPICS } from '@/features/onboarding/schema';

type Mode = (typeof SESSION_MODES)[number]['value'];
type Difficulty = (typeof SESSION_DIFFICULTIES)[number]['value'];

interface Props {
  defaultTopics: string[];
  defaultDifficulty: Difficulty;
  topicCounts: Record<string, number>;
}

export function TopicSelectionForm({ defaultTopics, defaultDifficulty, topicCounts }: Props) {
  const [topics, setTopics] = useState<string[]>(
    defaultTopics.length ? defaultTopics : ['React', 'JavaScript']
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [mode, setMode] = useState<Mode>('standard');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleTopic(t: string) {
    setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function handleStart() {
    setError(null);
    const payload = { mode, difficulty, topics } as CreateSessionInput;
    startTransition(async () => {
      const r = await createSession(payload);
      if (r && 'ok' in r && !r.ok) setError(r.message);
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-sm font-medium">Session length</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SESSION_MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={
                  'rounded-lg border p-4 text-left transition ' +
                  (active
                    ? 'border-foreground bg-card'
                    : 'border-border/60 bg-card hover:border-foreground/50')
                }
                aria-pressed={active}
              >
                <p className="font-medium">{m.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.meta}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium">Difficulty</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SESSION_DIFFICULTIES.map((d) => {
            const active = difficulty === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={
                  'rounded-full border px-4 py-1.5 text-sm transition ' +
                  (active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border/60 bg-card text-foreground/80 hover:border-foreground/50')
                }
                aria-pressed={active}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium">Topics</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select one or more. We'll pull questions matching your topics and difficulty.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ONBOARDING_TOPICS.map((t) => {
            const active = topics.includes(t);
            const count = topicCounts[t] ?? 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTopic(t)}
                className={
                  'flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ' +
                  (active
                    ? 'border-foreground bg-card'
                    : 'border-border/60 bg-card hover:border-foreground/50')
                }
                aria-pressed={active}
              >
                <span className="font-medium">{t}</span>
                <span className="text-xs text-muted-foreground">
                  {count > 0 ? `${count} questions` : 'no seed yet'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex items-center justify-end">
        <Button onClick={handleStart} disabled={pending || topics.length === 0}>
          {pending ? 'Starting…' : 'Start session'}
        </Button>
      </div>
    </div>
  );
}
