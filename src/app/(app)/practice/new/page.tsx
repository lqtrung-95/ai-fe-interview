import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { TopicSelectionForm } from '@/features/interview/topic-selection-form';
import { ONBOARDING_TOPICS } from '@/features/onboarding/schema';
import type { Level } from '@prisma/client';

export const metadata = { title: 'Start a session' };

const VALID_DIFFICULTIES: ReadonlyArray<Level> = ['junior', 'mid', 'senior'];

export default async function NewSessionPage({
  // Next.js 16: searchParams is async.
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; difficulty?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  // Per-topic seed availability so users see what's in the bank.
  const grouped = await prisma.seedQuestion.groupBy({
    by: ['topic'],
    _count: { topic: true },
  });
  const topicCounts: Record<string, number> = {};
  for (const row of grouped) {
    topicCounts[row.topic] = row._count.topic;
  }

  // Honor ?topic=X and ?difficulty=Y from recommendation cards, when valid.
  const requestedTopic = params.topic && (ONBOARDING_TOPICS as readonly string[]).includes(params.topic)
    ? params.topic
    : null;
  const requestedDifficulty = params.difficulty && (VALID_DIFFICULTIES as string[]).includes(params.difficulty)
    ? (params.difficulty as Level)
    : null;

  const defaultTopics = requestedTopic ? [requestedTopic] : user.preferredTopics;
  const defaultDifficulty = requestedDifficulty ?? user.level;

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
        defaultTopics={defaultTopics}
        defaultDifficulty={defaultDifficulty}
        topicCounts={topicCounts}
      />
    </div>
  );
}
