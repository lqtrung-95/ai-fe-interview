import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { listTargetJobs, createTargetJob, deleteTargetJob } from '@/features/target-jobs/server/target-job-service';

const createSchema = z.object({
  label: z.string().min(1).max(100).trim(),
  rawJd: z.string().min(50).max(20000).trim(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const jobs = await listTargetJobs(user.id);
    return NextResponse.json({ ok: true, jobs });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const result = await createTargetJob({
      userId: user.id,
      isPro: user.isPro,
      label: parsed.data.label,
      rawJd: parsed.data.rawJd,
    });

    if (!result.ok) {
      const status = result.code === 'not_pro' ? 403 : 422;
      return NextResponse.json({ ok: false, error: result.message, code: result.code }, { status });
    }

    return NextResponse.json({ ok: true, targetJob: result.targetJob }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const result = await deleteTargetJob({ userId: user.id, id });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
