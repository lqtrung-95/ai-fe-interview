'use client';

import type { Level } from '@prisma/client';
import { useSavePlanMutation } from '../hooks/use-study-plan-mutations';

const TOPICS = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral',
];

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'junior', label: 'Junior', desc: '0–2 years, core fundamentals' },
  { value: 'mid',    label: 'Mid',    desc: '2–5 years, design patterns + depth' },
  { value: 'senior', label: 'Senior', desc: '5+ years, architecture + trade-offs' },
  { value: 'staff',  label: 'Staff',  desc: 'Systems thinking + cross-team scope' },
];

const PREP_WINDOWS: { weeks: number; label: string; sub: string }[] = [
  { weeks: 1,  label: '1 week',    sub: 'Intensive sprint' },
  { weeks: 2,  label: '2 weeks',   sub: 'Focused preparation' },
  { weeks: 4,  label: '1 month',   sub: 'Solid coverage' },
  { weeks: 12, label: '3 months',  sub: 'Comprehensive mastery' },
];

interface Props {
  defaultTopics?: string[];
  defaultLevel?: Level;
  defaultPrepWeeks?: number;
  isEdit?: boolean;
}

export function StudyPlanSetupForm({ defaultTopics = [], defaultLevel = 'mid', defaultPrepWeeks = 4, isEdit = false }: Props) {
  const mutation = useSavePlanMutation();
  const pending  = mutation.isPending;
  const error    = mutation.error?.message ?? null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    mutation.mutate(new FormData(e.currentTarget));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Topics */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">
          Topics to focus on <span className="text-muted-foreground font-normal">(pick at least one)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const checked = defaultTopics.includes(t);
            return (
              <label key={t} className="group cursor-pointer">
                <input type="checkbox" name="topic" value={t} defaultChecked={checked} className="sr-only peer" />
                <span className="inline-flex rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer
                  border-border bg-transparent text-muted-foreground
                  peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary
                  hover:border-foreground/40 hover:text-foreground">
                  {t}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Level */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Target interview level</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((l) => (
            <label key={l.value} className="group cursor-pointer">
              <input type="radio" name="level" value={l.value} defaultChecked={defaultLevel === l.value} className="sr-only peer" />
              <span className="flex flex-col rounded-lg border p-3 transition-colors cursor-pointer
                border-border bg-card
                peer-checked:border-primary peer-checked:bg-primary/8
                hover:border-foreground/30">
                <span className="text-sm font-semibold peer-checked:text-primary group-has-[input:checked]:text-primary">{l.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{l.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Prep time */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Preparation window</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREP_WINDOWS.map((w) => (
            <label key={w.weeks} className="group cursor-pointer">
              <input type="radio" name="prepWeeks" value={w.weeks} defaultChecked={defaultPrepWeeks === w.weeks} className="sr-only peer" />
              <span className="flex flex-col rounded-lg border p-3 transition-colors cursor-pointer
                border-border bg-card
                peer-checked:border-primary peer-checked:bg-primary/8
                hover:border-foreground/30">
                <span className="text-sm font-semibold">{w.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{w.sub}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Saving…' : isEdit ? 'Update plan' : 'Create my study plan'}
      </button>
    </form>
  );
}
