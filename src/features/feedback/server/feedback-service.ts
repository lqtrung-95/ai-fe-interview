import 'server-only';
import { prisma } from '@/lib/db/client';
import { streamAITask } from '@/lib/ai/orchestrator';
import { evaluateOutputSchema, type EvaluateOutput } from '@/features/interview/ai-schemas';

export async function streamFeedback(answerId: string, userId: string): Promise<Response> {
  const answer = await prisma.userAnswer.findFirst({
    where: { id: answerId, userId },
    include: {
      feedback: true,
      question: {
        select: { question: true, expectedPoints: true },
      },
    },
  });
  if (!answer) return Response.json({ error: 'not_found' }, { status: 404 });
  if (answer.feedback) {
    return sseResponse(sse('final', fromFeedback(answer.feedback)));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true },
  });
  if (!user) return Response.json({ error: 'not_found' }, { status: 404 });

  const result = streamAITask(
    {
      type: 'evaluate_answer',
      input: {
        question: answer.question.question,
        expectedPoints: answer.question.expectedPoints,
        userAnswer: answer.answer,
        followUpAnswer: answer.followUpAnswer ?? undefined,
        level: user.level,
      },
    },
    { userId, sessionId: answer.sessionId }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encode(sse(event, data)));
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'object') send('partial', part.object);
          if (part.type === 'error') send('error', { message: 'Feedback generation failed.' });
        }
        const output = evaluateOutputSchema.parse(await result.object);
        const usage = await result.usage;
        const tokensUsed = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
        const feedback = await persistFeedback(answer.id, output, tokensUsed);
        send('final', fromFeedback(feedback));
      } catch (error) {
        console.error('[feedback.generate] failed:', error);
        send('error', { message: 'Could not generate feedback right now.' });
      } finally {
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}

async function persistFeedback(answerId: string, output: EvaluateOutput, tokensUsed: number) {
  return prisma.answerFeedback.create({
    data: {
      answerId,
      overallScore: output.overallScore,
      scoreCorrectness: output.scores.correctness,
      scoreCompleteness: output.scores.completeness,
      scoreClarity: output.scores.clarity,
      scoreDepth: output.scores.depth,
      scoreTradeoffThinking: output.scores.tradeoffThinking,
      scoreCommunication: output.scores.communication,
      whatWentWell: output.whatWentWell,
      whatWasMissing: output.whatWasMissing,
      technicalCorrections: output.technicalCorrections,
      improvementSuggestions: output.improvementSuggestions,
      betterAnswer: output.betterAnswer,
      seniorLevelAddition: output.seniorLevelAddition,
      recommendedNextPractice: output.recommendedNextPractice,
      modelUsed: 'orchestrator',
      tokensUsed,
    },
  });
}

function fromFeedback(feedback: Awaited<ReturnType<typeof persistFeedback>>) {
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
