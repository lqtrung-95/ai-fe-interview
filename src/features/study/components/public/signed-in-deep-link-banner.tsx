'use client';

/**
 * Shown on public question pages when the visitor is already signed in —
 * deep-links to the richer in-app detail page (quiz, full notes, progress)
 * instead of duplicating the gated experience publicly.
 */

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { track } from '@vercel/analytics';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  questionId: string;
  slug: string;
}

export function SignedInDeepLinkBanner({ questionId, slug }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-foreground/90">
          You&apos;re signed in — this question is in your bank with the quiz, full notes, and
          progress tracking.
        </p>
      </div>
      <Link
        href={`/question-bank/${questionId}`}
        onClick={() => track('question_cta_click', { slug, cta: 'deep_link' })}
        className={buttonVariants({ size: 'sm', className: 'text-xs' })}
      >
        Open in your question bank
        <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </div>
  );
}
