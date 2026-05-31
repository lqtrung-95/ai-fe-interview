import Link from 'next/link';
import { Clock3, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { listSessions } from '@/features/history/server/history-service';
import { SessionListItem } from '@/features/history/components/session-list-item';
import { HistoryFilterBar } from '@/features/history/components/history-filter-bar';
import { parseHistoryFilters } from '@/features/history/history-filters-schema';

export const metadata = { title: 'History' };

export default async function HistoryPage({
  // Next.js 16: searchParams is async.
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const filters = parseHistoryFilters(raw);
  const sessions = await listSessions(user.id, filters);
  const hasActiveFilters = Boolean(filters.topic || filters.minScore || filters.from || filters.to);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">History</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Session history</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Review past questions, answers, feedback, and summaries.
          </p>
        </div>
        <Link href="/practice/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New session
        </Link>
      </header>

      <div className="mb-8">
        <HistoryFilterBar />
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 px-8 py-20 text-center">
          <Clock3 className="mx-auto mb-4 size-8 text-muted-foreground" />
          <p className="text-lg font-bold tracking-tight">
            {hasActiveFilters ? 'No sessions match these filters.' : 'No sessions yet.'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Try widening the date range or clearing the score floor.'
              : 'Start a practice session to see it here.'}
          </p>
          {!hasActiveFilters && (
            <div className="mt-6">
              <Link href="/practice/new" className={buttonVariants()}>
                Start first session →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionListItem key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
