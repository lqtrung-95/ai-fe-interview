'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  challengeId: string;
  submissionId: string;
}

export function AiCodeReviewPanel({ challengeId, submissionId }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [reviewText, setReviewText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function requestReview() {
    setState('loading');
    setReviewText('');
    setErrorMsg('');

    try {
      const res = await fetch(
        `/api/coding-challenges/${challengeId}/submissions/${submissionId}/ai-review`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setErrorMsg(data?.message ?? 'Failed to generate AI review. Try again.');
        setState('error');
        return;
      }

      if (!res.body) {
        setState('error');
        setErrorMsg('Empty response from server.');
        return;
      }

      // If cached, Content-Type is text/plain (non-streaming response)
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setReviewText(accumulated);
      }

      setState('done');
    } catch {
      setState('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  if (state === 'idle') {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Get an AI analysis of your solution — complexity, edge cases, and alternatives.
        </p>
        <button onClick={requestReview} className={buttonVariants({ size: 'sm', className: 'shrink-0 gap-1.5' })}>
          <Sparkles className="h-3.5 w-3.5" />
          Get AI Review
        </button>
      </div>
    );
  }

  if (state === 'loading' && !reviewText) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-4 text-sm text-muted-foreground animate-pulse">
        Analyzing your code…
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {errorMsg}
      </div>
    );
  }

  // Streaming in progress or done — render markdown
  const html = marked.parse(reviewText) as string;

  return (
    <div className="rounded-lg border border-border/60 bg-card/60 px-4 py-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        AI Code Review
        {state === 'loading' && (
          <span className="ml-1 text-muted-foreground font-normal">streaming…</span>
        )}
      </div>
      <div
        className="challenge-prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
