import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { guardGeneralLimit } from '@/lib/rate-limit/guard';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

// Signals are produced client-side by the sandbox (axe-core on the live render).
// They're the user's own measurements for their own critique — faking them only
// fools the submitter, so we persist them as-is rather than re-running server-side.
const signalSchema = z.object({
  status: z.enum(['ok', 'render_error', 'compile_error']),
  renderError: z.string().max(2000).optional(),
  violationCount: z.number().int().min(0).max(500),
  seriousOrCritical: z.number().int().min(0).max(500),
  violations: z
    .array(
      z.object({
        id: z.string().max(120),
        impact: z.enum(['minor', 'moderate', 'serious', 'critical']).nullable(),
        help: z.string().max(500),
        nodes: z.number().int().min(0).max(1000),
      }),
    )
    .max(100),
  render: z
    .object({
      mountCommits: z.number().int().min(0).max(100000),
      interactionCommits: z.number().int().min(0).max(100000),
      interacted: z.boolean(),
    })
    .nullable(),
  checks: z
    .array(z.object({ id: z.string().max(120), label: z.string().max(300), passed: z.boolean() }))
    .max(50),
});

const bodySchema = z.object({
  code: z.string().min(1).max(20_000),
  signals: signalSchema,
});

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
  const challenge = await prisma.codingChallenge.findUnique({
    where: { id },
    select: { id: true, kind: true },
  });
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (challenge.kind !== 'component') {
    return NextResponse.json({ error: 'wrong_kind' }, { status: 400 });
  }

  const { signals } = parsed.data;
  // "passed" = rendered cleanly, no serious/critical a11y violations, and all
  // authored functional checks satisfied.
  const checksPass = signals.checks.every((c) => c.passed);
  const status =
    signals.status === 'ok' && signals.seriousOrCritical === 0 && checksPass ? 'passed' : 'failed';

  const submission = await prisma.codingSubmission.create({
    data: {
      userId: user.id,
      challengeId: id,
      code: parsed.data.code,
      language: 'jsx',
      status,
      testResults: signals as never,
      passedCount: signals.violationCount === 0 ? 1 : 0,
      totalCount: 1,
      executionMs: null,
    },
    select: { id: true },
  });

  return NextResponse.json({ submissionId: submission.id, status });
}
