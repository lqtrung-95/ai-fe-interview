import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import type { FeedbackPayload } from '@/features/feedback/feedback-types';
import type { HistoryFilters } from '../history-filters-schema';

export async function listSessions(userId: string, filters: HistoryFilters = {}) {
  const where: Prisma.InterviewSessionWhereInput = { userId };

  if (filters.topic) {
    where.topics = { has: filters.topic };
  }
  if (filters.minScore !== undefined) {
    where.overallScore = { gte: filters.minScore };
  }
  if (filters.from || filters.to) {
    const startedAt: Prisma.DateTimeFilter = {};
    if (filters.from) startedAt.gte = new Date(`${filters.from}T00:00:00Z`);
    if (filters.to) startedAt.lte = new Date(`${filters.to}T23:59:59Z`);
    where.startedAt = startedAt;
  }

  return prisma.interviewSession.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 100,
    include: {
      summary: true,
      questions: { select: { id: true, answer: { select: { id: true } } } },
    },
  });
}

export async function getSessionDetail(sessionId: string, userId: string) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      summary: true,
      questions: {
        orderBy: { order: 'asc' },
        include: { answer: { include: { feedback: true } } },
      },
    },
  });
  if (!session) return null;

  return {
    id: session.id,
    mode: session.mode,
    topics: session.topics,
    difficulty: session.difficulty,
    status: session.status,
    overallScore: session.overallScore,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    summary: session.summary,
    questions: session.questions.map((question) => ({
      id: question.id,
      question: question.question,
      topic: question.topic,
      difficulty: question.difficulty,
      type: question.type,
      order: question.order,
      answer: question.answer
        ? {
            id: question.answer.id,
            answer: question.answer.answer,
            followUpAnswer: question.answer.followUpAnswer,
            feedback: question.answer.feedback ? toFeedbackPayload(question.answer.feedback) : null,
          }
        : null,
    })),
  };
}

function toFeedbackPayload(feedback: {
  id: string;
  answerId: string;
  overallScore: number;
  scoreCorrectness: number;
  scoreCompleteness: number;
  scoreClarity: number;
  scoreDepth: number;
  scoreTradeoffThinking: number;
  scoreCommunication: number;
  whatWentWell: string[];
  whatWasMissing: string[];
  technicalCorrections: string[];
  improvementSuggestions: string[];
  betterAnswer: string;
  seniorLevelAddition: string | null;
  recommendedNextPractice: string[];
}): FeedbackPayload {
  return {
    id: feedback.id,
    answerId: feedback.answerId,
    overallScore: feedback.overallScore,
    scores: {
      correctness: feedback.scoreCorrectness,
      completeness: feedback.scoreCompleteness,
      clarity: feedback.scoreClarity,
      depth: feedback.scoreDepth,
      tradeoffThinking: feedback.scoreTradeoffThinking,
      communication: feedback.scoreCommunication,
    },
    whatWentWell: feedback.whatWentWell,
    whatWasMissing: feedback.whatWasMissing,
    technicalCorrections: feedback.technicalCorrections,
    improvementSuggestions: feedback.improvementSuggestions,
    betterAnswer: feedback.betterAnswer,
    seniorLevelAddition: feedback.seniorLevelAddition ?? undefined,
    recommendedNextPractice: feedback.recommendedNextPractice,
  };
}
