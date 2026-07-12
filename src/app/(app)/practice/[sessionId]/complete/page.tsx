import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { getSummary, getPreviousPersonalBest } from '@/features/feedback/server/summary-service';
import { getSessionDetail } from '@/features/history/server/history-service';
import { SummaryView } from '@/features/feedback/components/summary-view';
import { SessionQuestionBreakdown } from '@/features/feedback/components/session-question-breakdown';
import { ShareSessionButton } from '@/features/feedback/components/share-session-button';
import { PersonalBestBanner } from '@/features/feedback/components/personal-best-banner';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://frontcoach.app';
  return {
    title: 'Session summary',
    openGraph: {
      images: [{ url: `${base}/api/og/session?id=${sessionId}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function CompletePage({ params }: PageProps) {
  const user = await requireUser();
  const { sessionId } = await params;
  const [summary, prevBest, detail] = await Promise.all([
    getSummary(sessionId, user.id),
    getPreviousPersonalBest(user.id, sessionId),
    getSessionDetail(sessionId, user.id),
  ]);
  if (!summary) notFound();

  // Mock interviews reveal the full per-question debrief here — it's the payoff
  // for going through the session without any live feedback.
  const isMock = detail?.mode === 'mock';

  return (
    <div className="app-page mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          {isMock ? 'Mock interview' : 'Practice'}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {isMock ? 'Mock interview complete' : 'Session complete'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isMock
            ? 'No live feedback during the run — here is the full debrief on everything you answered.'
            : "Here's how you did — review the breakdown below."}
        </p>
      </header>
      {summary.overallScore !== null && (
        <PersonalBestBanner score={summary.overallScore} prevBest={prevBest} />
      )}
      <SummaryView summary={summary} />

      {/* Full per-question debrief — mock interviews only. */}
      {isMock && detail && (
        <section className="mt-12">
          <div className="mb-6 border-t border-border/50 pt-8">
            <h2 className="text-xl font-bold tracking-tight">Full breakdown</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every question with your answer, the score, and a stronger model answer.
            </p>
          </div>
          <SessionQuestionBreakdown questions={detail.questions} />
        </section>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/practice/new" className={buttonVariants({ size: 'lg' })}>
          Practice again →
        </Link>
        <Link href="/history" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          View history
        </Link>
        <ShareSessionButton sessionId={sessionId} score={summary.overallScore} />
        <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
