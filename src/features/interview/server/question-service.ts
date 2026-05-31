import 'server-only';
import { prisma } from '@/lib/db/client';
import { runAITask } from '@/lib/ai/orchestrator';
import { buildCvContext } from '@/lib/cv/cv-context-builder';
import type { CvData } from '@/lib/cv/cv-types';
import type { QuestionInput } from '../ai-schemas';
import type { InterviewQuestion, InterviewSession, User } from '@prisma/client';

const SEED_PROBABILITY = 0.7; // PRD §7.5 hybrid: 70% rephrase seed, 30% pure AI

interface NextQuestionArgs {
  user: User;
  session: InterviewSession;
}

/**
 * Returns the next question for a session — either the existing in-progress
 * question (if one exists and is unanswered) or creates a new one.
 *
 * Persists the InterviewQuestion row BEFORE returning so client always has
 * a stable id even if the network fails post-write.
 */
export async function nextQuestion(args: NextQuestionArgs): Promise<InterviewQuestion> {
  const existing = await prisma.interviewQuestion.findFirst({
    where: { sessionId: args.session.id, answer: null },
    orderBy: { order: 'desc' },
  });
  if (existing) return existing;

  const previous = await prisma.interviewQuestion.findMany({
    where: { sessionId: args.session.id },
    orderBy: { order: 'asc' },
    select: { question: true, order: true, topic: true },
  });

  // Rotate through topics: pick the next topic least represented in this session.
  const topic = pickTopic(args.session.topics, previous.map((p) => p.topic));

  // Hybrid: try seed first with probability, else pure-AI.
  const useSeed = Math.random() < SEED_PROBABILITY;
  let seedQuestion: { id: string; question: string; expectedPoints: string[] } | null = null;
  if (useSeed) {
    seedQuestion = await pickSeedQuestion({
      topic,
      difficulty: args.session.difficulty,
      sessionId: args.session.id,
    });
  }

  // Build CV context when the session was started with CV-grounded mode.
  // cvContext is NOT stored in AICall logs (privacy).
  let cvContext: string | undefined;
  if (args.session.usesCv && args.user.cvData) {
    const ctx = buildCvContext(args.user.cvData as CvData);
    cvContext = ctx ?? undefined;
  }

  const input: QuestionInput = {
    topic,
    difficulty: args.session.difficulty,
    level: args.user.level,
    sessionMode: args.session.mode,
    targetRole: args.user.targetRole,
    targetCompanyType: args.user.targetCompanyType,
    avoidQuestions: previous.map((p) => p.question),
    seed: seedQuestion ?? undefined,
    cvContext,
  };

  const ai = await runAITask(
    { type: 'generate_question', input },
    { userId: args.user.id, sessionId: args.session.id }
  );

  const order = previous.length;
  return prisma.interviewQuestion.create({
    data: {
      sessionId: args.session.id,
      topic,
      difficulty: args.session.difficulty,
      type: ai.type,
      question: ai.question,
      expectedPoints: ai.expectedPoints,
      order,
      seedQuestionId: seedQuestion?.id,
    },
  });
}

// ----------------------------------------------------------------------------

function pickTopic(sessionTopics: string[], previousTopics: string[]): string {
  if (sessionTopics.length === 1) return sessionTopics[0];
  const counts = new Map<string, number>(sessionTopics.map((t) => [t, 0]));
  for (const t of previousTopics) {
    if (counts.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best = sessionTopics[0];
  let bestCount = Infinity;
  for (const [topic, c] of counts) {
    if (c < bestCount) {
      best = topic;
      bestCount = c;
    }
  }
  return best;
}

async function pickSeedQuestion(args: {
  topic: string;
  difficulty: 'junior' | 'mid' | 'senior';
  sessionId: string;
}): Promise<{ id: string; question: string; expectedPoints: string[] } | null> {
  // Get seed candidates matching topic+difficulty, exclude ones already used
  // in this session, pick one at random.
  const usedInSession = await prisma.interviewQuestion.findMany({
    where: { sessionId: args.sessionId, seedQuestionId: { not: null } },
    select: { seedQuestionId: true },
  });
  const excludeIds = usedInSession.map((u) => u.seedQuestionId!).filter(Boolean);

  const candidates = await prisma.seedQuestion.findMany({
    where: {
      topic: args.topic,
      difficulty: args.difficulty,
      id: excludeIds.length ? { notIn: excludeIds } : undefined,
    },
    select: { id: true, question: true, expectedPoints: true },
    take: 50,
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
