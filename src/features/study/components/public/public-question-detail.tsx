/**
 * Free-preview composition for /questions/[slug]: question header, ELI5,
 * diagram, gated teasers, and a same-topic internal-link mesh.
 *
 * SECURITY: receives PublicQuestionDetail only — the type carries no
 * rubric/expectedPoints/followUps, so the answer key can't leak into HTML.
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  PublicQuestionDetail as PublicQuestionDetailData,
  PublicQuestionSummary,
} from '@/features/study/server/study-public-service';
import { getTopicPageByTopic } from '@/lib/seo/question-topic-slugs';
import { Eli5Card } from '@/features/study/components/eli5-card';
import { StudyDiagram } from '@/features/study/components/study-diagram';
import { GatedSectionTeaser } from './gated-section-teaser';
import { SignedInDeepLinkBanner } from './signed-in-deep-link-banner';
import { DIFFICULTY_BADGE_CLASSES, QUESTION_TYPE_LABELS } from './public-question-badge-maps';

interface Props {
  q: PublicQuestionDetailData;
  related: PublicQuestionSummary[];
  isSignedIn: boolean;
}

export function PublicQuestionDetail({ q, related, isSignedIn }: Props) {
  const appHref = `/question-bank/${q.id}`;

  return (
    <div className="reader-page mx-auto max-w-3xl space-y-8 px-6 py-10">
      {/* Breadcrumb back to hub */}
      <Link
        href="/questions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All interview questions
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {q.topic}
          </span>
          {q.subtopic && q.subtopic !== q.topic && q.subtopic.length <= 60 && (
            <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              {q.subtopic}
            </span>
          )}
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${DIFFICULTY_BADGE_CLASSES[q.difficulty] ?? ''}`}
          >
            {q.difficulty}
          </span>
          <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            {QUESTION_TYPE_LABELS[q.type] ?? q.type}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-snug tracking-tight text-foreground">
          {q.question}
        </h1>
      </div>

      {isSignedIn && <SignedInDeepLinkBanner questionId={q.id} slug={q.slug} />}

      {/* Free preview: ELI5 + diagram */}
      {q.childExplanation && <Eli5Card explanation={q.childExplanation} />}
      {q.diagramSvg && (
        <section className="space-y-3">
          <SectionHeading title="Diagram" />
          <StudyDiagram svgHtml={q.diagramSvg} />
        </section>
      )}

      {/* Gated content teasers */}
      <section className="space-y-3">
        <SectionHeading title="Go deeper" />
        <div className="space-y-3">
          <GatedSectionTeaser
            title="Interactive quiz"
            benefit="Check your understanding with an instant-feedback quick check."
            slug={q.slug}
            cta="quiz"
            signedInHref={isSignedIn ? appHref : undefined}
          />
          <GatedSectionTeaser
            title="Detailed notes"
            benefit="Senior-level deep dive: internals, pitfalls, and a self-interview ladder."
            slug={q.slug}
            cta="notes"
            signedInHref={isSignedIn ? appHref : undefined}
          />
          <GatedSectionTeaser
            title="Practice with AI feedback"
            benefit="Answer out loud, get scored on correctness, depth, and clarity."
            slug={q.slug}
            cta="practice"
            signedInHref={isSignedIn ? '/practice/new' : undefined}
          />
        </div>
      </section>

      {/* Same-topic internal links */}
      {related.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <SectionHeading title={`More ${q.topic} questions`} />
            {getTopicPageByTopic(q.topic) && (
              <Link
                href={`/questions/${getTopicPageByTopic(q.topic)!.slug}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all {q.topic} questions →
              </Link>
            )}
          </div>
          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/80">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/questions/${r.slug}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 text-sm leading-snug text-foreground/90 group-hover:text-foreground">
                  {r.question}
                </span>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_BADGE_CLASSES[r.difficulty] ?? ''}`}
                >
                  {r.difficulty}
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {title}
    </h2>
  );
}
