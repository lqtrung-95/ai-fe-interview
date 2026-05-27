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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <SummaryView summary={summary} />
      <div className="mt-8 flex gap-3">
        <Link href="/practice/new" className={buttonVariants()}>
          New session
        </Link>
        <Link href="/history" className={buttonVariants({ variant: 'outline' })}>
          History
        </Link>
      </div>
    </div>
  );
}
