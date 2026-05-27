import 'server-only';
import { prisma } from '@/lib/db/client';

interface SessionArgs {
  sessionId: string;
  userId: string;
}

export async function getSession(args: SessionArgs) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: args.sessionId, userId: args.userId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          answer: {
            include: { feedback: true },
          },
        },
      },
      summary: true,
    },
  });

  if (!session) return null;

  const activeQuestion = session.questions.find((question) => !question.answer);
  return {
    id: session.id,
    mode: session.mode,
    topics: session.topics,
    difficulty: session.difficulty,
    status: session.status,
    overallScore: session.overallScore,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    activeQuestionId: activeQuestion?.id ?? null,
    questions: session.questions.map((question) => ({
      id: question.id,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      type: question.type,
      question: question.question,
      expectedPoints: question.expectedPoints,
      order: question.order,
      seedQuestionId: question.seedQuestionId,
      answer: question.answer
        ? {
            id: question.answer.id,
            answer: question.answer.answer,
            followUpAnswer: question.answer.followUpAnswer,
            createdAt: question.answer.createdAt.toISOString(),
            feedback: question.answer.feedback,
          }
        : null,
    })),
    summary: session.summary,
  };
}

export async function endSession(args: SessionArgs): Promise<'not_found' | 'ended'> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: args.sessionId, userId: args.userId },
    select: { id: true, status: true },
  });
  if (!session) return 'not_found';
  if (session.status !== 'in_progress') return 'ended';

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: 'ended_early',
      completedAt: new Date(),
    },
  });
  return 'ended';
}
