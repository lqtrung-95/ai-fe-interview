import { notFound } from 'next/navigation';
import { BriefcaseBusiness, Layers3, SlidersHorizontal } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { InterviewShell } from '@/features/interview/interview-shell';

export const metadata = { title: 'Interview session' };

const QUESTION_TARGETS = {
  quick: 3,
  standard: 5,
  deep_coaching: 5,
} as const;

function formatSessionMode(mode: string) {
  return mode.replace('_', ' ');
}

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
    <div className="app-page mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Session metadata header — question counter lives in InterviewMainPanel (live) */}
      <header className="border-b border-border/50 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-primary/12 px-3 font-semibold text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                {formatSessionMode(session.mode)}
              </span>
              <span className="inline-flex h-8 items-center rounded-lg border border-border/70 px-3 text-muted-foreground">
                {session.difficulty}
              </span>
              <span className="inline-flex h-8 items-center rounded-lg border border-border/70 px-3 text-muted-foreground">
                {target} questions
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Layers3 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Focus areas
              </div>
              <div className="flex flex-wrap gap-2">
                {session.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex min-h-8 items-center rounded-lg border border-border/70 bg-card/55 px-3 py-1 text-sm font-medium leading-5 text-muted-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {session.label && (
            <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border/70 bg-card/70 px-4 py-3 text-sm font-medium text-foreground shadow-sm lg:max-w-md">
              <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 leading-5">{session.label}</span>
            </div>
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
