import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { listPublicQuestionSummaries } from '@/features/study/server/study-public-service';
import { PublicQuestionHubList } from '@/features/study/components/public/public-question-hub-list';
import { getSiteUrl } from '@/lib/seo/site-url';
import { QUESTION_TOPIC_PAGES } from '@/lib/seo/question-topic-slugs';

export const metadata: Metadata = {
  title: 'Frontend Interview Questions — Free Question Bank',
  description:
    'Browse hundreds of real frontend interview questions across JavaScript, React, system design, performance, and more — each with a plain-English explanation and architecture diagram.',
  alternates: { canonical: `${getSiteUrl()}/questions` },
};

// Same rationale as the in-app question-bank detail page: the reader layout
// reads auth cookies, so render fully dynamic instead of streaming.
export const dynamic = 'force-dynamic';

export default async function PublicQuestionsHubPage() {
  const all = await listPublicQuestionSummaries();

  return (
    <div className="reader-page mx-auto max-w-4xl space-y-8 px-6 py-12">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Question Bank
        </p>
        <h1 className="reader-gradient-text text-2xl font-bold tracking-tight">
          Frontend Interview Questions
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          {all.length} real interview questions with plain-English explanations and diagrams.
          Free to read — sign up for quizzes, detailed notes, and AI-scored practice.
        </p>
      </div>

      {/* Topic pills — link to the per-topic hub pages */}
      <div className="flex flex-wrap gap-2">
        {QUESTION_TOPIC_PAGES.map((t) => (
          <Link
            key={t.slug}
            href={`/questions/${t.slug}`}
            className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            {t.topic} ({all.filter((q) => q.topic === t.topic).length})
          </Link>
        ))}
      </div>

      <PublicQuestionHubList questions={all} />

      {/* Bottom CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/90">
            Want quizzes, senior-level notes, and AI feedback on your answers?
          </p>
        </div>
        <Link
          href="/sign-in?next=/questions"
          className={buttonVariants({ size: 'sm', className: 'text-xs' })}
        >
          Sign up free
        </Link>
      </div>
    </div>
  );
}
