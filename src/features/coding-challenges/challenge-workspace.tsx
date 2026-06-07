'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ChallengeDescription } from './challenge-description';
import { CodeEditorPanel } from './code-editor-panel';
import { TestResultsPanel } from './test-results-panel';
import { AiCodeReviewPanel } from './ai-code-review-panel';
import type { ChallengePublic, SubmissionResult } from './types';

interface Props {
  challenge: ChallengePublic;
  isAuthenticated: boolean;
  isPro: boolean;
}

export function ChallengeWorkspace({ challenge, isAuthenticated, isPro }: Props) {
  const [code, setCode] = useState(challenge.starterCode);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  function handleReset() {
    setCode(challenge.starterCode);
    setSubmissionResult(null);
    setError(null);
    setSubmissionId(null);
  }

  async function handleSubmit() {
    if (!isAuthenticated) {
      setError('Sign in to submit your solution.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/coding-challenges/${challenge.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? 'Something went wrong. Please try again.');
        return;
      }

      const data = (await res.json()) as SubmissionResult & { submissionId: string };
      setSubmissionResult(data);
      setSubmissionId(data.submissionId);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      {/* Left panel — description */}
      <div className="w-full overflow-y-auto border-b border-border/60 md:w-1/2 md:border-b-0 md:border-r">
        <ChallengeDescription challenge={challenge} />
      </div>

      {/* Right panel — editor + results */}
      <div className="flex w-full flex-col md:w-1/2">
        {/* Editor */}
        <div className="min-h-0 flex-1">
          <CodeEditorPanel
            value={code}
            onChange={setCode}
            onReset={handleReset}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Error */}
        {error && !isAuthenticated ? (
          <div className="border-t border-border/60 px-4 py-3 flex items-center justify-between gap-3 text-sm bg-amber-500/5">
            <span className="text-amber-700 dark:text-amber-400">{error}</span>
            <Link href="/sign-in" className={buttonVariants({ size: 'sm' })}>
              Sign in
            </Link>
          </div>
        ) : error ? (
          <div className="border-t border-border/60 px-4 py-3 text-sm text-red-600 dark:text-red-400 bg-red-500/5">
            {error}
          </div>
        ) : null}

        {/* Test results */}
        {submissionResult && (
          <div className="max-h-[40vh] overflow-y-auto px-4 py-3">
            <TestResultsPanel
              result={submissionResult}
              testCases={challenge.testCases}
              aiReviewSlot={
                submissionResult.status === 'passed' ? (
                  <AiReviewSlot
                    isPro={isPro}
                    challengeId={challenge.id}
                    submissionId={submissionId!}
                  />
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AiReviewSlot({
  isPro,
  challengeId,
  submissionId,
}: {
  isPro: boolean;
  challengeId: string;
  submissionId: string;
}) {
  if (!isPro) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Link href="/upgrade" className="text-primary underline underline-offset-2">
          Upgrade to Pro
        </Link>{' '}
        to get an AI review of your solution.
      </div>
    );
  }

  return <AiCodeReviewPanel challengeId={challengeId} submissionId={submissionId} />;
}
