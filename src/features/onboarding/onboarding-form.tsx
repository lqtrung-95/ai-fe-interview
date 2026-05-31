'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Upload } from 'lucide-react';
import { saveOnboarding } from './save-action';
import {
  ONBOARDING_TOPICS,
  ONBOARDING_COMPANY_TYPES,
  ONBOARDING_ROLES,
  type OnboardingInput,
} from './schema';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const LEVELS: Array<{ value: 'junior' | 'mid' | 'senior' | 'staff'; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
];

interface Defaults {
  level?: 'junior' | 'mid' | 'senior' | 'staff';
  targetRole?: string | null;
  targetCompanyType?: string | null;
  preferredTopics?: string[];
}

interface OnboardingFormProps {
  defaults: Defaults;
  /** When true, shows "Save changes" and a back link instead of "Continue". */
  isEdit?: boolean;
  /** Where to redirect after a successful save (default: /practice/new). */
  redirectTo?: string;
}

export function OnboardingForm({ defaults, isEdit = false, redirectTo }: OnboardingFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [level, setLevel] = useState<'junior' | 'mid' | 'senior' | 'staff'>(defaults.level ?? 'mid');
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
      const result = await saveOnboarding(payload, redirectTo);
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

      {/* Optional CV upload — only shown on first-time onboarding, not edit mode */}
      {!isEdit && <CvUploadSection />}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {isEdit && redirectTo && (
          <Link href={redirectTo} className={buttonVariants({ variant: 'ghost' })}>
            Cancel
          </Link>
        )}
        <Button type="submit" disabled={pending || topics.length === 0}>
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Optional CV upload during first-time onboarding.
 * Calls the same /api/cv/parse endpoint as the Settings page.
 * No state management beyond this component — success is enough.
 */
function CvUploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleFile(file: File) {
    setStatus('uploading');
    setErrorMsg('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/cv/parse', { method: 'POST', body: form });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Upload failed');
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Upload your CV</Label>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Optional
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Your first practice session will reference your real companies, projects, and tech stack.
        You can always add or update it later in Settings.
      </p>

      {status === 'done' ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          CV uploaded — your sessions will be personalised from the start.
        </div>
      ) : (
        <label
          className={cn(
            'flex items-center gap-3 rounded-lg border border-dashed border-border/60 px-4 py-3',
            'cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/[0.03]',
            status === 'uploading' && 'pointer-events-none opacity-50',
          )}
        >
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span className="text-sm text-muted-foreground">
            {status === 'uploading' ? 'Uploading and parsing…' : 'Click to upload PDF or text file'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="sr-only"
            disabled={status === 'uploading'}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}

      {status === 'error' && errorMsg && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
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
