import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { TopicSelectionForm } from '@/features/interview/topic-selection-form';

export const metadata = { title: 'Start a session' };

export default async function NewSessionPage() {
  const user = await requireUser();

  // Per-topic seed availability so users see what's in the bank.
  const grouped = await prisma.seedQuestion.groupBy({
    by: ['topic'],
    _count: { topic: true },
  });
  const topicCounts: Record<string, number> = {};
  for (const row of grouped) {
    topicCounts[row.topic] = row._count.topic;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">New session</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pick what you want to practice</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Three things: how long, how hard, what topics. We'll do the rest.
        </p>
      </header>
      <TopicSelectionForm
        defaultTopics={user.preferredTopics}
        defaultDifficulty={user.level}
        topicCounts={topicCounts}
      />
    </div>
  );
}
