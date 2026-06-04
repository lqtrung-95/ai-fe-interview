'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Level } from '@prisma/client';
import { useSavePlanMutation } from '../hooks/use-study-plan-mutations';
import { useTailorToJobMutation } from '../hooks/use-tailor-to-job-mutation';
import { STUDY_PLAN_TOPICS } from '../lib/job-tailoring';

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

interface TargetJobOption {
  id: string;
  label: string;
}

interface Props {
  defaultTopics?: string[];
  defaultLevel?: Level;
  defaultPrepWeeks?: number;
  isEdit?: boolean;
  targetJobs?: TargetJobOption[];
}

export function StudyPlanSetupForm({
  defaultTopics = [],
  defaultLevel = 'mid',
  defaultPrepWeeks = 4,
  isEdit = false,
  targetJobs = [],
}: Props) {
  const [topics, setTopics] = useState<string[]>(defaultTopics);
  const [level, setLevel] = useState<Level>(defaultLevel);
  const [rationale, setRationale] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>(targetJobs[0]?.id ?? '');

  const saveMutation = useSavePlanMutation();
  const tailorMutation = useTailorToJobMutation();

  function toggleTopic(topic: string) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
    setRationale(null);
  }

  function handleTailor() {
    if (!selectedJobId) return;
    tailorMutation.mutate(selectedJobId, {
      onSuccess: (result) => {
        setTopics(result.topics);
        setLevel(result.level);
        setRationale(result.rationale);
      },
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Replace checkbox/radio values with controlled state
    fd.delete('topic');
    topics.forEach((t) => fd.append('topic', t));
    fd.set('level', level);
    saveMutation.mutate(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Job tailoring — shown only when user has saved target jobs */}
      {targetJobs.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary shrink-0" />
            <p className="text-sm font-semibold text-foreground">Tailor to a target job</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {targetJobs.map((job) => (
                <option key={job.id} value={job.id}>{job.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleTailor}
              disabled={tailorMutation.isPending || !selectedJobId}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {tailorMutation.isPending ? (
                <><Loader2 className="size-3.5 animate-spin" /> Tailoring…</>
              ) : (
                'Auto-select topics'
              )}
            </button>
          </div>
          {tailorMutation.isError && (
            <p className="text-xs text-destructive">{tailorMutation.error.message}</p>
          )}
          {rationale && (
            <p className="text-xs text-muted-foreground leading-relaxed">{rationale}</p>
          )}
        </div>
      )}

      {/* Topics */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">
          Topics to focus on <span className="text-muted-foreground font-normal">(pick at least one)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {STUDY_PLAN_TOPICS.map((t) => {
            const checked = topics.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTopic(t)}
                className={
                  'inline-flex rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ' +
                  (checked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground')
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Level */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Target interview level</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              className={
                'flex min-h-20 flex-col rounded-lg border p-3 text-left transition-colors ' +
                (level === l.value
                  ? 'border-primary bg-primary/8'
                  : 'border-border bg-card hover:border-foreground/30')
              }
            >
              <span className={`text-sm font-semibold ${level === l.value ? 'text-primary' : ''}`}>
                {l.label}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">{l.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Prep time */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Preparation window</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREP_WINDOWS.map((w) => (
            <label key={w.weeks} className="group cursor-pointer">
              <input
                type="radio"
                name="prepWeeks"
                value={w.weeks}
                defaultChecked={defaultPrepWeeks === w.weeks}
                className="sr-only peer"
              />
              <span className="flex min-h-20 flex-col rounded-lg border p-3 transition-colors cursor-pointer border-border bg-card peer-checked:border-primary peer-checked:bg-primary/8 hover:border-foreground/30">
                <span className="text-sm font-semibold">{w.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{w.sub}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {saveMutation.isError && (
        <p className="text-sm text-destructive">{saveMutation.error.message}</p>
      )}

      <button
        type="submit"
        disabled={saveMutation.isPending || topics.length === 0}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saveMutation.isPending ? 'Saving…' : isEdit ? 'Update plan' : 'Create my study plan'}
      </button>
    </form>
  );
}
