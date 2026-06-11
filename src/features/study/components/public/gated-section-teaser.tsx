'use client';

/**
 * Locked-content card shown on public question pages below the free preview.
 * Gating is presentational only — the gated data (quiz, detailed notes) is
 * simply never fetched for anonymous visitors; nothing sensitive is hidden
 * behind CSS.
 */

import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { track } from '@vercel/analytics';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  title: string;     // e.g. "Interactive quiz"
  benefit: string;   // one-line value statement
  slug: string;      // question slug — used for the post-sign-in redirect + analytics
  cta: string;       // analytics id: 'quiz' | 'notes' | 'practice'
  /** When the visitor is signed in, link straight into the app instead of sign-up. */
  signedInHref?: string;
}

export function GatedSectionTeaser({ title, benefit, slug, cta, signedInHref }: Props) {
  const href = signedInHref ?? `/sign-in?next=${encodeURIComponent(`/questions/${slug}`)}`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/80 p-5">
      {/* Blurred placeholder lines suggesting the locked content */}
      <div aria-hidden="true" className="pointer-events-none select-none space-y-2 blur-[6px] opacity-50">
        <div className="h-3 w-3/4 rounded bg-muted-foreground/30" />
        <div className="h-3 w-full rounded bg-muted-foreground/20" />
        <div className="h-3 w-5/6 rounded bg-muted-foreground/25" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{benefit}</p>
          </div>
        </div>
        <Link
          href={href}
          onClick={() => track('question_cta_click', { slug, cta })}
          className={buttonVariants({ size: 'sm', className: 'text-xs' })}
        >
          {signedInHref ? 'Open in app' : 'Sign up free'}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
