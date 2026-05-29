/**
 * Study section data layer.
 * Queries SeedQuestion table for the /question-bank browse + detail pages.
 *
 * All public functions are wrapped with Next.js unstable_cache so the DB is
 * only hit once per unique argument set per hour (or until 'seed-questions'
 * tag is revalidated after a re-seed).
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/client';
import type { Difficulty, QuestionType } from '@prisma/client';

const CACHE_OPTS = { revalidate: 3600, tags: ['seed-questions'] };

export interface StudyFilters {
  topic?: string;
  difficulty?: Difficulty;
  type?: QuestionType;
  search?: string;
}

export interface StudyQuestionSummary {
  id: string;
  topic: string;
  subtopic: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  hasChildExplanation: boolean;
  hasDiagram: boolean;
  tags: string[];
}

export interface StudyQuestionDetail {
  id: string;
  topic: string;
  subtopic: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  expectedPoints: string[];
  followUps: string[];
  tags: string[];
  childExplanation: string | null;
  detailedExplanation: string | null;
  diagramSvg: string | null;
  diagramMermaid: string | null;
  quiz: string | null; // JSON-serialised QuizData
}

export function listStudyQuestions(filters: StudyFilters = {}): Promise<StudyQuestionSummary[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.seedQuestion.findMany({
        where: {
          ...(filters.topic ? { topic: filters.topic } : {}),
          ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
          ...(filters.type ? { type: filters.type } : {}),
          ...(filters.search
            ? { question: { contains: filters.search, mode: 'insensitive' } }
            : {}),
        },
        select: {
          id: true, topic: true, subtopic: true, difficulty: true,
          type: true, question: true, tags: true,
          childExplanation: true, diagramSvg: true,
        },
        orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }],
      });
      return rows.map((r) => ({
        id: r.id, topic: r.topic, subtopic: r.subtopic,
        difficulty: r.difficulty, type: r.type, question: r.question,
        tags: r.tags,
        hasChildExplanation: !!r.childExplanation,
        hasDiagram: !!r.diagramSvg,
      }));
    },
    ['study-questions-list', JSON.stringify(filters)],
    CACHE_OPTS,
  )();
}

export function getStudyQuestion(id: string): Promise<StudyQuestionDetail | null> {
  return unstable_cache(
    async () =>
      prisma.seedQuestion.findUnique({
        where: { id },
        select: {
          id: true, topic: true, subtopic: true, difficulty: true,
          type: true, question: true, expectedPoints: true, followUps: true,
          tags: true, childExplanation: true, detailedExplanation: true,
          diagramSvg: true, diagramMermaid: true, quiz: true,
        },
      }),
    ['study-question-detail', id],
    CACHE_OPTS,
  )();
}

/** Returns all distinct topics present in the seed bank. */
export function getStudyTopics(): Promise<string[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.seedQuestion.findMany({
        select: { topic: true },
        distinct: ['topic'],
        orderBy: { topic: 'asc' },
      });
      return rows.map((r) => r.topic);
    },
    ['study-topics'],
    CACHE_OPTS,
  )();
}

/** Total question count, optionally filtered. */
export function countStudyQuestions(filters: StudyFilters = {}): Promise<number> {
  return unstable_cache(
    async () =>
      prisma.seedQuestion.count({
        where: {
          ...(filters.topic ? { topic: filters.topic } : {}),
          ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
          ...(filters.type ? { type: filters.type } : {}),
          ...(filters.search
            ? { question: { contains: filters.search, mode: 'insensitive' } }
            : {}),
        },
      }),
    ['study-questions-count', JSON.stringify(filters)],
    CACHE_OPTS,
  )();
}
