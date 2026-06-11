/**
 * Public (anonymous) data layer for the SEO question pages (/questions).
 *
 * SECURITY: every select here is limited to display fields — rubric,
 * expectedPoints and followUps are the interviewer answer key and must never
 * ship in anonymous HTML. Gated content (quiz, detailedExplanation) is exposed
 * only as boolean flags so teasers can be honest without leaking the payload.
 *
 * Same caching contract as study-service.ts: unstable_cache, 1h revalidate,
 * invalidated via the 'seed-questions' tag after a re-seed.
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/client';
import type { Difficulty, QuestionType } from '@prisma/client';

const CACHE_OPTS = { revalidate: 3600, tags: ['seed-questions'] };

export interface PublicQuestionSummary {
  id: string;
  slug: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  hasDiagram: boolean;
}

export interface PublicQuestionDetail {
  id: string;
  slug: string;
  topic: string;
  subtopic: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  tags: string[];
  childExplanation: string | null;
  diagramSvg: string | null;
  hasQuiz: boolean;
  hasDetailedExplanation: boolean;
}

/** All slugged questions as lightweight summaries — hub page + related-question links. */
export function listPublicQuestionSummaries(): Promise<PublicQuestionSummary[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.seedQuestion.findMany({
        where: { slug: { not: null } },
        select: {
          id: true, slug: true, topic: true, difficulty: true,
          question: true, diagramSvg: true,
        },
        orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }],
      });
      return rows.map((r) => ({
        id: r.id,
        slug: r.slug as string,
        topic: r.topic,
        difficulty: r.difficulty,
        question: r.question,
        hasDiagram: !!r.diagramSvg,
      }));
    },
    ['public-question-summaries'],
    CACHE_OPTS,
  )();
}

/** Free-preview detail for /questions/[slug] — display fields only, no answer key. */
export function getStudyQuestionBySlug(slug: string): Promise<PublicQuestionDetail | null> {
  return unstable_cache(
    async () => {
      const r = await prisma.seedQuestion.findUnique({
        where: { slug },
        select: {
          id: true, slug: true, topic: true, subtopic: true, difficulty: true,
          type: true, question: true, tags: true, childExplanation: true,
          diagramSvg: true, quiz: true, detailedExplanation: true,
        },
      });
      if (!r) return null;
      return {
        id: r.id,
        slug: r.slug as string,
        topic: r.topic,
        subtopic: r.subtopic,
        difficulty: r.difficulty,
        type: r.type,
        question: r.question,
        tags: r.tags,
        childExplanation: r.childExplanation,
        diagramSvg: r.diagramSvg,
        hasQuiz: !!r.quiz,
        hasDetailedExplanation: !!r.detailedExplanation,
      };
    },
    ['public-question-by-slug', slug],
    CACHE_OPTS,
  )();
}

/**
 * Slugs of questions worth indexing — used by sitemap.ts. Excludes rows
 * without a childExplanation: a bare question renders a thin page that
 * hurts more than it helps (the content sprint fills these gaps).
 */
export function listIndexableQuestionSlugs(): Promise<string[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.seedQuestion.findMany({
        where: { slug: { not: null }, childExplanation: { not: null } },
        select: { slug: true },
        orderBy: { slug: 'asc' },
      });
      return rows.map((r) => r.slug as string);
    },
    ['public-question-slugs'],
    CACHE_OPTS,
  )();
}
