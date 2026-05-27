import 'server-only';
import { prisma } from '@/lib/db/client';
import { streamAITask } from '@/lib/ai/orchestrator';
import { questionOutputSchema, type QuestionInput } from '../ai-schemas';
import type { InterviewSession, User } from '@prisma/client';

const SEED_PROBABILITY = 0.7;

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
    select: { question: true, topic: true },
  });
  const topic = pickTopic(args.session.topics, previous.map((p) => p.topic));
  const seedQuestion =
    Math.random() < SEED_PROBABILITY
      ? await pickSeedQuestion({
          topic,
          difficulty: args.session.difficulty,
          sessionId: args.session.id,
        })
      : null;
  const input: QuestionInput = {
    topic,
    difficulty: args.session.difficulty,
    level: args.user.level,
    sessionMode: args.session.mode,
    targetRole: args.user.targetRole,
    targetCompanyType: args.user.targetCompanyType,
    avoidQuestions: previous.map((p) => p.question),
    seed: seedQuestion ?? undefined,
  };

  const result = streamAITask(
    { type: 'generate_question', input },
    { userId: args.user.id, sessionId: args.session.id }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encode(sse(event, data)));
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'object') send('partial', part.object);
          if (part.type === 'error') send('error', { message: 'Question generation failed.' });
        }

        const ai = questionOutputSchema.parse(await result.object);
        const question = await prisma.interviewQuestion.create({
          data: {
            sessionId: args.session.id,
            topic,
            difficulty: args.session.difficulty,
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
