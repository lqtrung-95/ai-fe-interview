import 'server-only';
import { prisma } from '@/lib/db/client';
import { runAITask } from '@/lib/ai/orchestrator';
import { summaryOutputSchema, type SummaryInput } from '@/features/interview/ai-schemas';

type GenerateSummaryResult =
  | { ok: true; summary: Awaited<ReturnType<typeof getSummary>> }
  | { ok: false; status: 404 | 409; error: string };

export async function generateSummary(
  sessionId: string,
  userId: string
): Promise<GenerateSummaryResult> {
  const existing = await getSummary(sessionId, userId);
  if (existing) return { ok: true, summary: existing };

  const session = await getSessionForSummary(sessionId, userId);
  if (!session) return { ok: false, status: 404, error: 'not_found' };

  const answered = session.questions.filter((q) => q.answer?.feedback);
  if (answered.length === 0) {
    return { ok: false, status: 409, error: 'no_feedback' };
  }

  const input: SummaryInput = {
    userProfile: {
      level: session.user.level,
      targetRole: session.user.targetRole,
      targetCompanyType: session.user.targetCompanyType,
    },
    perAnswer: answered.map((q) => ({
      question: q.question,
      topic: q.topic,
      difficulty: q.difficulty,
      overallScore: q.answer!.feedback!.overallScore,
      missingPoints: q.answer!.feedback!.whatWasMissing.slice(0, 3),
    })),
  };

  const ai = await runAITask(
    { type: 'generate_summary', input },
    { userId, sessionId }
  );
  const output = summaryOutputSchema.parse(ai);

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      overallScore: output.overallScore,
      summary: {
        create: {
          overallScore: output.overallScore,
          strongAreas: output.strongAreas,
          weakAreas: output.weakAreas,
          repeatedMistakes: output.repeatedMistakes,
          recommendedTopics: output.recommendedTopics,
          actionItems: output.actionItems,
        },
      },
    },
  });

  return { ok: true, summary: (await getSummary(sessionId, userId))! };
}

export async function getSummary(sessionId: string, userId: string) {
  return prisma.sessionSummary.findFirst({
    where: { sessionId, session: { userId } },
    include: {
      session: {
        select: {
          id: true,
          mode: true,
          topics: true,
          difficulty: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  });
}

function getSessionForSummary(sessionId: string, userId: string) {
  return prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      user: {
        select: { level: true, targetRole: true, targetCompanyType: true },
      },
      questions: {
        orderBy: { order: 'asc' },
        include: { answer: { include: { feedback: true } } },
      },
    },
  });
}
