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
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;

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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {session.mode.replace('_', ' ')} · {session.topics.join(' + ')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Mock interview</h1>
      </header>
      <InterviewShell
        sessionId={session.id}
        initialQuestion={initialQuestion}
        initialCompleted={completed}
        questionTarget={target}
      />
    </div>
  );
}
