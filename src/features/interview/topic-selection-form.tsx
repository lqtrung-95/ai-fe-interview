'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSession } from './server/create-session-action';
import { SESSION_DIFFICULTIES, SESSION_MODES, type CreateSessionInput } from './session-config-schema';

type Mode = (typeof SESSION_MODES)[number]['value'];
type Difficulty = (typeof SESSION_DIFFICULTIES)[number]['value'];

interface Props {
  defaultTopics: string[];
  defaultDifficulty: Difficulty;
  topicCounts: Record<string, number>;
}

const GROUPS = [
  ['Core Frontend', ['JavaScript', 'React', 'Browser & Web APIs']],
  ['Performance', ['Web Performance']],
  ['Architecture', ['Frontend System Design']],
  ['Interview Skills', ['Testing', 'Behavioral']],
] as const;

/** Timer options: 0 = no limit, otherwise seconds per question */
const TIMER_OPTIONS = [
  { value: 0, label: 'No limit' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
] as const;

export function TopicSelectionForm({ defaultTopics, defaultDifficulty, topicCounts }: Props) {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>(defaultTopics.length ? defaultTopics : ['JavaScript']);
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [mode, setMode] = useState<Mode>('standard');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleTopic(topic: string) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    );
  }

  function handleStart() {
    setError(null);
    const payload = { mode, difficulty, topics } as CreateSessionInput;
    startTransition(async () => {
      const result = await createSession(payload);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Redirect with ?timer= so the session page can initialise the countdown
      const url = timerSeconds > 0
        ? `/practice/${result.sessionId}?timer=${timerSeconds}`
        : `/practice/${result.sessionId}`;
      router.push(url);
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Choose a mode</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {SESSION_MODES.map((item) => (
            <ChoiceCard
              key={item.value}
              active={mode === item.value}
              title={item.label}
              detail={item.meta}
              onClick={() => setMode(item.value)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Choose difficulty</h2>
        <div className="inline-grid grid-cols-3 rounded-md border border-border/70 bg-card p-1">
          {SESSION_DIFFICULTIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDifficulty(item.value)}
              className={
                'rounded px-5 py-2 text-sm transition ' +
                (difficulty === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          Time per question
        </h2>
        <div className="flex flex-wrap gap-2">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimerSeconds(opt.value)}
              className={
                'rounded-lg border px-4 py-2 text-sm transition ' +
                (timerSeconds === opt.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground')
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Choose topics <span className="text-muted-foreground">(select 1 or more)</span></h2>
        {GROUPS.map(([group, groupTopics]) => (
          <div key={group} className="rounded-lg border border-border/70 bg-card p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">{group}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {groupTopics.map((topic) => (
                <TopicCheck
                  key={topic}
                  active={topics.includes(topic)}
                  topic={topic}
                  count={topicCounts[topic] ?? 0}
                  onClick={() => toggleTopic(topic)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={handleStart} disabled={pending || topics.length === 0}>
          {pending ? 'Starting...' : 'Start session'}
        </Button>
      </div>
    </div>
  );
}

function ChoiceCard(props: { active: boolean; title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        'rounded-lg border p-4 text-left transition ' +
        (props.active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-card hover:border-primary/40')
      }
    >
      <p className="text-sm font-semibold">{props.title}</p>
      <p className={'mt-2 text-xs leading-5 ' + (props.active ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
        {props.detail}
      </p>
    </button>
  );
}

function TopicCheck(props: { active: boolean; topic: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={props.onClick} className="flex items-start gap-3 text-left">
      <span className={'mt-0.5 flex h-4 w-4 items-center justify-center rounded border ' + (props.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')}>
        {props.active && <Check className="h-3 w-3" />}
      </span>
      <span>
        <span className="block text-sm font-medium">{props.topic}</span>
        <span className="text-xs text-muted-foreground">{props.count} questions</span>
      </span>
    </button>
  );
}
