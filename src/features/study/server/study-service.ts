/**
 * Study section data layer.
 * Queries SeedQuestion table for the /question-bank browse + detail pages.
 */

import { prisma } from '@/lib/db/client';
import type { Difficulty, QuestionType } from '@prisma/client';

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
}

export async function listStudyQuestions(
  filters: StudyFilters = {},
): Promise<StudyQuestionSummary[]> {
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
      id: true,
      topic: true,
      subtopic: true,
      difficulty: true,
      type: true,
      question: true,
      tags: true,
      childExplanation: true,
      diagramSvg: true,
    },
    orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }],
  });

  return rows.map((r) => ({
    id: r.id,
    topic: r.topic,
    subtopic: r.subtopic,
    difficulty: r.difficulty,
    type: r.type,
    question: r.question,
    tags: r.tags,
    hasChildExplanation: !!r.childExplanation,
    hasDiagram: !!r.diagramSvg,
  }));
}

export async function getStudyQuestion(id: string): Promise<StudyQuestionDetail | null> {
  const row = await prisma.seedQuestion.findUnique({
    where: { id },
    select: {
      id: true,
      topic: true,
      subtopic: true,
      difficulty: true,
      type: true,
      question: true,
      expectedPoints: true,
      followUps: true,
      tags: true,
      childExplanation: true,
      detailedExplanation: true,
      diagramSvg: true,
      diagramMermaid: true,
    },
  });
  return row;
}

/** Returns all distinct topics present in the seed bank. */
export async function getStudyTopics(): Promise<string[]> {
  const rows = await prisma.seedQuestion.findMany({
    select: { topic: true },
    distinct: ['topic'],
    orderBy: { topic: 'asc' },
  });
  return rows.map((r) => r.topic);
}

/** Total question count, optionally filtered. */
export async function countStudyQuestions(filters: StudyFilters = {}): Promise<number> {
  return prisma.seedQuestion.count({
    where: {
      ...(filters.topic ? { topic: filters.topic } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.search
        ? { question: { contains: filters.search, mode: 'insensitive' } }
        : {}),
    },
  });
}
