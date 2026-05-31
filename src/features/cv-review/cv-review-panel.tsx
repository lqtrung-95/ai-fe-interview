'use client';

/**
 * Client panel for the CV Review page.
 * Calls POST /api/cv/review, shows animated progress steps while loading,
 * then renders structured feedback sections.
 */

import { useState, useEffect } from 'react';
import {
  Sparkles, CheckCircle2, AlertCircle,
  Star, KeySquare, TrendingUp, Type, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CvReviewLoadingState } from './cv-review-loading-state';
import type { CvReview } from './cv-review-types';

const PROGRESS_STEPS = [
  'Analysing your experience…',
  'Checking ATS keyword coverage…',
  'Reviewing impact statements…',
  'Evaluating action verbs…',
  'Generating frontend suggestions…',
];

interface Props {
  /** Pre-check: true when cvData exists in the DB (validated server-side). */
  hasCv: boolean;
}

export function CvReviewPanel({ hasCv }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [review, setReview] = useState<CvReview | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progressStep, setProgressStep] = useState(0);

  // Cycle through fake progress messages while loading
  useEffect(() => {
    if (status !== 'loading') return;
    const id = setInterval(() => {
      setProgressStep((s) => (s + 1) % PROGRESS_STEPS.length);
    }, 1800);
    return () => clearInterval(id);
  }, [status]);

  async function generate() {
    setStatus('loading');
    setProgressStep(0);
    setErrorMsg('');
    try {
      const res = await fetch('/api/cv/review', { method: 'POST' });
      const data = await res.json() as { ok: boolean; review?: CvReview; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Review failed');
      setReview(data.review!);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  if (!hasCv) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-8 py-16 text-center">
        <p className="text-sm font-medium">No CV found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload your résumé in Settings first.
        </p>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold">Ready to review your CV</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Get an AI-powered breakdown: ATS score, keyword gaps, impact improvements, and frontend-specific suggestions.
          </p>
        </div>
        <Button size="lg" onClick={generate} className="mt-2">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Review
        </Button>
      </div>
    );
  }

  if (status === 'loading') {
    return <CvReviewLoadingState message={PROGRESS_STEPS[progressStep]} />;
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
        <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
        <p className="text-sm text-destructive">{errorMsg}</p>
        <Button variant="outline" onClick={generate}>Try again</Button>
      </div>
    );
  }

  if (!review) return null;

  const scoreColor = review.overallScore >= 7
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : review.overallScore >= 5
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      : 'text-red-500 bg-red-500/10 border-red-500/20';

  return (
    <div className="space-y-5">
      {/* Score badge */}
      <div className={cn('inline-flex flex-col items-center rounded-xl border px-5 py-3 text-center min-w-[90px]', scoreColor)}>
        <p className="text-3xl font-bold tabular-nums">{review.overallScore}<span className="text-lg font-normal opacity-60">/10</span></p>
        <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5 opacity-70">CV Score</p>
      </div>

      {/* Top Strengths */}
      <ReviewSection icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} title="Top Strengths">
        <div className="flex flex-wrap gap-2">
          {review.topStrengths.map((s) => (
            <span key={s} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {s}
            </span>
          ))}
        </div>
      </ReviewSection>

      {/* ATS */}
      <ReviewSection icon={<KeySquare className="h-4 w-4 text-primary" />} title="ATS Compatibility">
        <p className="text-sm text-muted-foreground leading-relaxed">{review.atsSummary}</p>
        {review.atsKeywordsToAdd.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Keywords to add:</p>
            <div className="flex flex-wrap gap-1.5">
              {review.atsKeywordsToAdd.map((k) => (
                <span key={k} className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  + {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </ReviewSection>

      {/* Impact */}
      <ReviewSection icon={<TrendingUp className="h-4 w-4 text-amber-500" />} title="Impact & Quantification">
        <p className="text-sm text-muted-foreground leading-relaxed">{review.impactFeedback}</p>
      </ReviewSection>

      {/* Verbs */}
      <ReviewSection icon={<Type className="h-4 w-4 text-purple-500" />} title="Action Verbs">
        <p className="text-sm text-muted-foreground leading-relaxed">{review.verbFeedback}</p>
      </ReviewSection>

      {/* Frontend Suggestions */}
      <ReviewSection icon={<Lightbulb className="h-4 w-4 text-amber-500" />} title="Frontend-Specific Suggestions">
        <ul className="space-y-2">
          {review.frontendSuggestions.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <Star className="h-3.5 w-3.5 shrink-0 text-primary/50 mt-0.5" />
              {s}
            </li>
          ))}
        </ul>
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
