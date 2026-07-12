import 'server-only';
import { prisma } from '@/lib/db/client';

export async function getOrCreateShareToken(sessionId: string, userId: string): Promise<string | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: { shareToken: true },
  });
  if (!session) return null;
  if (session.shareToken) return session.shareToken;

  const token = crypto.randomUUID();
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { shareToken: token },
  });
  return token;
}

export async function getPublicSessionByToken(token: string) {
  return prisma.sessionSummary.findFirst({
    where: { session: { shareToken: token } },
    select: {
      overallScore: true,
      strongAreas: true,
      weakAreas: true,
      session: {
        select: {
          topics: true,
          difficulty: true,
          completedAt: true,
        },
      },
    },
  });
}
