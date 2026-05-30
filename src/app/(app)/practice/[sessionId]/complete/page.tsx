import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { getSummary } from '@/features/feedback/server/summary-service';
import { SummaryView } from '@/features/feedback/components/summary-view';

export const metadata = { title: 'Session summary' };

export default async function CompletePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;
  const summary = await getSummary(sessionId, user.id);
  if (!summary) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Practice</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Session complete</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here's how you did — review the breakdown below.
        </p>
      </header>
      <SummaryView summary={summary} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/practice/new" className={buttonVariants({ size: 'lg' })}>
          Practice again →
        </Link>
        <Link href="/history" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          View history
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
