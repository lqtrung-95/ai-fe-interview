import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { guardGeneralLimit } from '@/lib/rate-limit/guard';
import { prisma } from '@/lib/db/client';
import { executeJs } from '@/lib/coding-challenges/local-js-executor';
import { buildTestHarness } from '@/lib/coding-challenges/test-harness-builder';
import { parseAndValidateResults } from '@/lib/coding-challenges/submission-validator';

export const runtime = 'nodejs';
export const maxDuration = 30;

const bodySchema = z.object({
  code: z.string().min(1).max(20_000),
});

type TestCaseRaw = {
  id: string;
  label: string;
  input: string;
  expected: string;
  isHidden: boolean;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const limited = await guardGeneralLimit(user.id);
  if (limited) return limited;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  const challenge = await prisma.codingChallenge.findUnique({ where: { id } });
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const testCases = challenge.testCases as unknown as TestCaseRaw[];
  const harness = buildTestHarness(parsed.data.code, testCases);

  const execResult = await executeJs(harness, challenge.timeLimit);

  const { testResults, passedCount, totalCount, status } = parseAndValidateResults(
    execResult.run.stdout,
    testCases
  );

  const executionMs = null;

  const submission = await prisma.codingSubmission.create({
    data: {
      userId: user.id,
      challengeId: id,
      code: parsed.data.code,
      language: 'javascript',
      status,
      testResults: testResults as never,
      passedCount,
      totalCount,
      executionMs,
    },
  });

  return NextResponse.json({
    submissionId: submission.id,
    status,
    testResults,
    passedCount,
    totalCount,
    executionMs,
  });
}
