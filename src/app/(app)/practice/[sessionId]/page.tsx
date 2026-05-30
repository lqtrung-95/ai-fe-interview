import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { InterviewShell } from '@/features/interview/interview-shell';

export const metadata = { title: 'Interview session' };

const QUESTION_TARGETS = {
  quick: 3,
  standard: 5,
  deep_coaching: 5,
} as const;

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ timer?: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;
  const { timer } = await searchParams;
  const timerSeconds = timer ? Math.max(0, parseInt(timer, 10) || 0) : 0;

  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { answer: { select: { id: true } } },
      },
    },
  });
  if (!session) notFound();

  // Pick up the in-progress question if one exists (resume mid-session).
  const activeRow = session.questions.find((q) => !q.answer);
  const completed = session.questions.filter((q) => q.answer).length;
  const initialQuestion = activeRow
    ? {
        questionId: activeRow.id,
        question: activeRow.question,
        topic: activeRow.topic,
        difficulty: activeRow.difficulty,
        type: activeRow.type,
        order: activeRow.order,
      }
    : null;

  const target = QUESTION_TARGETS[session.mode];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            {session.mode.replace('_', ' ')} · {session.difficulty}
          </span>
          <span>{session.topics.join(' + ')}</span>
        </div>
        <p className="text-xs text-muted-foreground">Question {completed + 1} of {target}</p>
      </header>
      <InterviewShell
        sessionId={session.id}
        initialQuestion={initialQuestion}
        initialCompleted={completed}
        questionTarget={target}
        timerSeconds={timerSeconds}
      />
    </div>
  );
}
