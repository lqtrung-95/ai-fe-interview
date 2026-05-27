import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { getSessionDetail } from '@/features/history/server/history-service';
import { SessionDetail } from '@/features/history/components/session-detail';

export const metadata = { title: 'Session detail' };

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;
  const session = await getSessionDetail(sessionId, user.id);
  if (!session) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/history" className={buttonVariants({ variant: 'outline' })}>
        Back to history
      </Link>
      <div className="mt-8">
        <SessionDetail session={session} />
      </div>
    </div>
  );
}
