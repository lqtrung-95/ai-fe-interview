'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Timer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createSession } from './server/create-session-action';
import { SESSION_DIFFICULTIES, SESSION_MODES, type CreateSessionInput } from './session-config-schema';

const CUSTOM_SENTINEL = -1; // sentinel value to indicate "custom" mode

type Mode = (typeof SESSION_MODES)[number]['value'];
type Difficulty = (typeof SESSION_DIFFICULTIES)[number]['value'];

interface Props {
  defaultTopics: string[];
  defaultDifficulty: Difficulty;
  topicCounts: Record<string, number>;
  /** Whether the user has a parsed CV — shows the "Based on my CV" toggle when true. */
  hasCv?: boolean;
}

const GROUPS = [
  ['Core Frontend', ['JavaScript', 'React', 'Browser & Web APIs']],
  ['Performance', ['Web Performance']],
  ['Architecture', ['Frontend System Design']],
  ['Interview Skills', ['Testing', 'Behavioral']],
] as const;

/** Timer preset options: 0 = no limit, CUSTOM_SENTINEL = custom input */
const TIMER_OPTIONS = [
  { value: 0,               label: 'No limit' },
  { value: 180,             label: '3 min' },
  { value: 300,             label: '5 min' },
  { value: 600,             label: '10 min' },
  { value: CUSTOM_SENTINEL, label: 'Custom' },
] as const;

export function TopicSelectionForm({ defaultTopics, defaultDifficulty, topicCounts, hasCv = false }: Props) {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>(defaultTopics.length ? defaultTopics : ['JavaScript']);
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [mode, setMode] = useState<Mode>('standard');
  const [timerSeconds, setTimerSeconds] = useState(0); // 0=no limit, CUSTOM_SENTINEL=custom
  const [customMinutes, setCustomMinutes] = useState('');  // raw input for custom mode
  const [usesCv, setUsesCv] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = timerSeconds === CUSTOM_SENTINEL;
  // Resolved seconds to pass to the session (custom input converted from minutes)
  const resolvedSeconds = isCustom
    ? Math.max(0, Math.round(parseFloat(customMinutes || '0') * 60))
    : timerSeconds;
  const [pending, startTransition] = useTransition();

  function toggleTopic(topic: string) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    );
  }

  function handleStart() {
    setError(null);
    const payload = { mode, difficulty, topics, usesCv } as CreateSessionInput;
    startTransition(async () => {
      const result = await createSession(payload);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Redirect with ?timer= so the session page can initialise the countdown
      const url = resolvedSeconds > 0
        ? `/practice/${result.sessionId}?timer=${resolvedSeconds}`
        : `/practice/${result.sessionId}`;
      router.push(url);
    });
  }

  return (
    <div className="space-y-8">
      {/* Mode */}
      <section className="space-y-3">
        <SectionLabel>Mode</SectionLabel>
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

      {/* Difficulty */}
      <section className="space-y-3">
        <SectionLabel>Difficulty</SectionLabel>
        <div className="inline-grid grid-cols-3 rounded-xl border border-border/70 bg-card p-1">
          {SESSION_DIFFICULTIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDifficulty(item.value)}
              className={
                'rounded-lg px-5 py-2 text-sm font-medium transition ' +
                (difficulty === item.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground')
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Timer */}
      <section className="space-y-3">
        <SectionLabel icon={<Timer className="h-3.5 w-3.5" />}>Time per question</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimerSeconds(opt.value)}
              className={
                'rounded-lg border px-4 py-2 text-sm font-medium transition ' +
                (timerSeconds === opt.value
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground')
              }
            >
              {opt.label}
            </button>
          ))}

          {/* Custom duration input — revealed when "Custom" is selected */}
          {isCustom && (
            <div className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-card px-3 py-1.5">
              <input
                type="number"
                min={1}
                max={60}
                placeholder="e.g. 7"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-14 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          )}
        </div>
      </section>

      {/* CV personalisation toggle — only shown when user has a parsed CV */}
      {hasCv && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setUsesCv((v) => !v)}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl border p-4 text-left transition-all',
              usesCv
                ? 'border-primary/50 bg-primary/8'
                : 'border-border/60 bg-card hover:border-primary/30',
            )}
          >
            <span className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
              usesCv ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
            )}>
              {usesCv && <Check className="h-3 w-3" />}
            </span>
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Personalise with my CV
              </span>
              <span className="text-xs text-muted-foreground">
                Questions will reference your real experience — companies, projects, and tech stack. Still pick topics below to set the domain.
              </span>
            </span>
          </button>
        </section>
      )}

      {/* Topics */}
      <section className="space-y-4">
        <SectionLabel>
          Topics{' '}
          <span className="ml-1 text-xs font-normal text-muted-foreground">(select 1 or more)</span>
        </SectionLabel>
        {GROUPS.map(([group, groupTopics]) => (
          <div key={group} className="rounded-xl border border-border/60 bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group}
            </p>
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
        <Button size="lg" onClick={handleStart} disabled={pending || topics.length === 0}>
          {pending ? 'Starting…' : 'Start session →'}
        </Button>
      </div>
    </div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {children}
    </h2>
  );
}

function ChoiceCard(props: { active: boolean; title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        'rounded-xl border p-4 text-left transition-all ' +
        (props.active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-sm')
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
    <button
      type="button"
      onClick={props.onClick}
      className={
        'flex items-start gap-3 rounded-lg border p-3 text-left transition-all ' +
        (props.active
          ? 'border-primary/50 bg-primary/5'
          : 'border-border/40 bg-background/60 hover:border-primary/30')
      }
    >
      <span className={
        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ' +
        (props.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')
      }>
        {props.active && <Check className="h-3 w-3" />}
      </span>
      <span>
        <span className="block text-sm font-medium leading-5">{props.topic}</span>
        <span className="text-[11px] text-muted-foreground">{props.count} questions</span>
      </span>
    </button>
  );
}
