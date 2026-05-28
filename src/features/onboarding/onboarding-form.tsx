'use client';

import { useState, useTransition } from 'react';
import { saveOnboarding } from './save-action';
import {
  ONBOARDING_TOPICS,
  ONBOARDING_COMPANY_TYPES,
  ONBOARDING_ROLES,
  type OnboardingInput,
} from './schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const LEVELS: Array<{ value: 'junior' | 'mid' | 'senior'; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

interface Defaults {
  level?: 'junior' | 'mid' | 'senior';
  targetRole?: string | null;
  targetCompanyType?: string | null;
  preferredTopics?: string[];
}

export function OnboardingForm({ defaults }: { defaults: Defaults }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [level, setLevel] = useState<'junior' | 'mid' | 'senior'>(defaults.level ?? 'mid');
  const [role, setRole] = useState<string>(defaults.targetRole ?? ONBOARDING_ROLES[1]);
  const [company, setCompany] = useState<string>(defaults.targetCompanyType ?? 'General');
  const [topics, setTopics] = useState<string[]>(defaults.preferredTopics ?? ['React', 'JavaScript']);

  function toggleTopic(t: string) {
    setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      level,
      targetRole: role,
      targetCompanyType: company,
      preferredTopics: topics,
    } as OnboardingInput;

    startTransition(async () => {
      const result = await saveOnboarding(payload);
      if (result && 'ok' in result && !result.ok) {
        setError(Object.values(result.fieldErrors).flat().join(', ') || 'Please review your selections.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FieldGroup label="Your current level">
        <ChipRow
          options={LEVELS.map((l) => l.value)}
          labels={LEVELS.map((l) => l.label)}
          value={level}
          onChange={(v) => setLevel(v as typeof level)}
        />
      </FieldGroup>

      <FieldGroup label="Role you're preparing for">
        <ChipRow options={[...ONBOARDING_ROLES]} value={role} onChange={setRole} />
      </FieldGroup>

      <FieldGroup label="Target company type">
        <ChipRow options={[...ONBOARDING_COMPANY_TYPES]} value={company} onChange={setCompany} />
      </FieldGroup>

      <FieldGroup label="Topics you want to practice">
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_TOPICS.map((t) => {
            const active = topics.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTopic(t)}
                className={
                  'rounded-full border px-4 py-1.5 text-sm transition ' +
                  (active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-card text-foreground/80 hover:border-primary/50 hover:text-foreground')
                }
                aria-pressed={active}
              >
                {t}
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={pending || topics.length === 0}>
          {pending ? 'Saving…' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly string[];
  labels?: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt, idx) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={
              'rounded-full border px-4 py-1.5 text-sm transition ' +
              (active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/60 bg-card text-foreground/80 hover:border-primary/50 hover:text-foreground')
            }
            aria-pressed={active}
          >
            {labels?.[idx] ?? opt}
          </button>
        );
      })}
    </div>
  );
}
