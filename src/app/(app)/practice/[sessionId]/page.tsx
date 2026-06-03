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
      {/* Session metadata header — question counter lives in InterviewMainPanel (live) */}
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            {session.mode.replace('_', ' ')} · {session.difficulty}
          </span>
          <span>{session.topics.join(' + ')}</span>
          {session.label && (
            <span className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1 font-medium text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              {session.label}
            </span>
          )}
        </div>
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
