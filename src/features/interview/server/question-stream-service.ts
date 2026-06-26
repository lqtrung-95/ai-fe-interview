import 'server-only';
import { prisma } from '@/lib/db/client';
import { streamAITask } from '@/lib/ai/orchestrator';
import { buildCvContext } from '@/lib/cv/cv-context-builder';
import { formatJdContext, type JdContext } from '@/features/target-jobs/target-job-types';
import type { CvData } from '@/lib/cv/cv-types';
import { questionOutputSchema, type QuestionInput, difficultyEnum } from '../ai-schemas';
import type { InterviewSession, User } from '@prisma/client';

const SEED_PROBABILITY = 0.7;

type Difficulty = 'junior' | 'mid' | 'senior';
const DIFFICULTY_ORDER: Difficulty[] = ['junior', 'mid', 'senior'];

/**
 * Adapts difficulty based on rolling session score.
 * Score ≥ 4.2 → bump up one tier; score ≤ 2.0 → drop one tier.
 * Stays within the session's base difficulty ±1 tier.
 */
function adaptDifficulty(base: Difficulty, scores: number[]): Difficulty {
  if (scores.length < 2) return base; // wait until 2 answers before adapting
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const baseIdx = DIFFICULTY_ORDER.indexOf(base);
  if (avg >= 4.2 && baseIdx < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[baseIdx + 1];
  if (avg <= 2.0 && baseIdx > 0) return DIFFICULTY_ORDER[baseIdx - 1];
  return base;
}

interface Args {
  user: User;
  session: InterviewSession;
}

export async function streamNextQuestion(args: Args): Promise<Response> {
  const existing = await prisma.interviewQuestion.findFirst({
    where: { sessionId: args.session.id, answer: null },
    orderBy: { order: 'desc' },
  });
  if (existing) {
    return sseResponse(sse('final', toPayload(existing)));
  }

  const previous = await prisma.interviewQuestion.findMany({
    where: { sessionId: args.session.id },
    orderBy: { order: 'asc' },
    select: {
      question: true,
      topic: true,
      answer: { select: { answer: true, feedback: { select: { overallScore: true } } } },
    },
  });
  const topic = pickTopic(args.session.topics, previous.map((p) => p.topic));

  // Adaptive difficulty: adjust based on rolling average of answered scores so far.
  const answeredScores = previous
    .map((q) => q.answer?.feedback?.overallScore)
    .filter((s): s is number => s !== undefined);
  const baseDifficulty = difficultyEnum.parse(args.session.difficulty);
  const difficulty = adaptDifficulty(baseDifficulty, answeredScores);

  // CV/experience sessions run conversationally (opener → drill into the
  // candidate's answers), so they skip canned seed questions entirely.
  const seedQuestion =
    !args.session.usesCv && Math.random() < SEED_PROBABILITY
      ? await pickSeedQuestion({ topic, difficulty, sessionId: args.session.id })
      : null;

  // CV context — NOT stored in AICall logs; only lives in the LLM prompt for this request.
  let cvContext: string | undefined;
  if (args.session.usesCv && args.user.cvData) {
    const ctx = buildCvContext(args.user.cvData as CvData);
    cvContext = ctx ?? undefined;
  }

  // Recent exchanges (last 2 answered) so a CV session drills into what the
  // candidate actually said rather than inventing a premise.
  const transcript = args.session.usesCv
    ? previous
        .filter((p): p is typeof p & { answer: { answer: string } } => !!p.answer)
        .slice(-2)
        .map((p) => ({ question: p.question, answer: p.answer.answer }))
    : undefined;

  // Job context — NOT stored in AICall logs; only lives in the LLM prompt for this request.
  let jdContext: string | undefined;
  if (args.session.targetJobId) {
    const job = await prisma.targetJob.findFirst({
      where: { id: args.session.targetJobId },
      select: { jdContext: true },
    });
    if (job?.jdContext) {
      jdContext = formatJdContext(job.jdContext as unknown as JdContext);
    }
  }

  const input: QuestionInput = {
    topic,
    difficulty,
    level: args.user.level,
    // Mock interviews generate the same questions as a standard mock — only the
    // feedback timing differs — so the prompt sees 'standard'.
    sessionMode: args.session.mode === 'mock' ? 'standard' : args.session.mode,
    targetRole: args.user.targetRole,
    targetCompanyType: args.user.targetCompanyType,
    avoidQuestions: previous.map((p) => p.question),
    seed: seedQuestion ?? undefined,
    cvContext,
    jdContext,
    transcript: transcript && transcript.length > 0 ? transcript : undefined,
  };

  const result = streamAITask(
    { type: 'generate_question', input },
    { userId: args.user.id, sessionId: args.session.id, isPro: args.user.isPro }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encode(sse(event, data)));
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'object') send('partial', part.object);
          if (part.type === 'error') {
            console.error('[question-stream] stream error part:', part.error);
            send('error', { message: 'Question generation failed.' });
          }
        }

        const ai = questionOutputSchema.parse(await result.object);
        const question = await prisma.interviewQuestion.create({
          data: {
            sessionId: args.session.id,
            topic,
            difficulty, // adapted difficulty, not necessarily the session base
            type: ai.type,
            question: ai.question,
            expectedPoints: ai.expectedPoints,
            order: previous.length,
            seedQuestionId: seedQuestion?.id,
          },
        });
        send('final', toPayload(question));
      } catch (error) {
        console.error('[question-stream] failed:', error);
        send('error', { message: 'The AI is having trouble. Try again in a moment.' });
      } finally {
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}

function toPayload(question: {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  type: string;
  order: number;
  expectedPoints: string[];
}) {
  return {
    questionId: question.id,
    question: question.question,
    topic: question.topic,
    difficulty: question.difficulty,
    type: question.type,
    order: question.order,
    expectedPoints: question.expectedPoints,
  };
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function sseResponse(body: BodyInit): Response {
  return new Response(body, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}

function pickTopic(sessionTopics: string[], previousTopics: string[]): string {
  if (sessionTopics.length === 1) return sessionTopics[0];
  const counts = new Map<string, number>(sessionTopics.map((t) => [t, 0]));
  for (const t of previousTopics) {
    if (counts.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best = sessionTopics[0];
  let bestCount = Infinity;
  for (const [topic, count] of counts) {
    if (count < bestCount) {
      best = topic;
      bestCount = count;
    }
  }
  return best;
}

async function pickSeedQuestion(args: {
  topic: string;
  difficulty: 'junior' | 'mid' | 'senior';
  sessionId: string;
}): Promise<{ id: string; question: string; expectedPoints: string[] } | null> {
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
