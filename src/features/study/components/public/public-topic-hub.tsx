/**
 * Per-topic hub page body (/questions/react, …) — head-term SEO pages.
 * Hand-written intro + the topic's question list + cross-links to the
 * other topic hubs and the all-questions hub.
 */

import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { PublicQuestionSummary } from '@/features/study/server/study-public-service';
import type { QuestionTopicPage } from '@/lib/seo/question-topic-slugs';
import { QUESTION_TOPIC_PAGES } from '@/lib/seo/question-topic-slugs';
import { PublicQuestionHubList } from './public-question-hub-list';

interface Props {
  page: QuestionTopicPage;
  questions: PublicQuestionSummary[]; // already filtered to this topic
}

export function PublicTopicHub({ page, questions }: Props) {
  const otherTopics = QUESTION_TOPIC_PAGES.filter((t) => t.slug !== page.slug);

  return (
    <div className="reader-page mx-auto max-w-4xl space-y-8 px-6 py-12">
      <Link
        href="/questions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All interview questions
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Question Bank
        </p>
        <h1 className="reader-gradient-text text-2xl font-bold tracking-tight">
          {page.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
        <p className="text-xs text-muted-foreground">
          {questions.length} questions — free to read, with quizzes and AI-scored practice for
          members.
        </p>
      </div>

      <PublicQuestionHubList questions={questions} />

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/90">
            Practice these with AI feedback and track what you&apos;ve mastered.
          </p>
        </div>
        <Link
          href={`/sign-in?next=/questions/${page.slug}`}
          className={buttonVariants({ size: 'sm', className: 'text-xs' })}
        >
          Sign up free
        </Link>
      </div>

      {/* Other topics — internal mesh */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Browse other topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherTopics.map((t) => (
            <Link
              key={t.slug}
              href={`/questions/${t.slug}`}
              className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {t.topic}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
