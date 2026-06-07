import { unstable_cache } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { TopicSelectionForm } from '@/features/interview/topic-selection-form';
import { ONBOARDING_TOPICS } from '@/features/onboarding/schema';
import type { Level } from '@prisma/client';

export const metadata = { title: 'Start a session' };

const VALID_DIFFICULTIES: ReadonlyArray<string> = ['junior', 'mid', 'senior'];
// Staff users practice at senior difficulty (no staff-rated questions exist).
type SessionDifficulty = 'junior' | 'mid' | 'senior';
function toSessionDifficulty(level: Level): SessionDifficulty {
  return level === 'staff' ? 'senior' : level;
}

// Seed question counts rarely change — cache for 1 hour.
const getSeedTopicCounts = unstable_cache(
  async () => {
    const grouped = await prisma.seedQuestion.groupBy({ by: ['topic'], _count: { topic: true } });
    const counts: Record<string, number> = {};
    for (const row of grouped) counts[row.topic] = row._count.topic;
    return counts;
  },
  ['seed-topic-counts'],
  { revalidate: 3600 },
);

export default async function NewSessionPage({
  // Next.js 16: searchParams is async.
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; difficulty?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const [topicCounts, targetJobs] = await Promise.all([
    getSeedTopicCounts(),
    user.isPro
      ? prisma.targetJob.findMany({
          where: { userId: user.id },
          select: { id: true, label: true },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  // Honor ?topic=X and ?difficulty=Y from recommendation cards, when valid.
  const requestedTopic =
    params.topic && (ONBOARDING_TOPICS as readonly string[]).includes(params.topic) ? params.topic : null;
  const requestedDifficulty =
    params.difficulty && VALID_DIFFICULTIES.includes(params.difficulty)
      ? (params.difficulty as SessionDifficulty)
      : null;

  const defaultTopics = requestedTopic ? [requestedTopic] : user.preferredTopics;
  const defaultDifficulty: SessionDifficulty = toSessionDifficulty(requestedDifficulty ?? user.level);

  return (
    <div className="app-page mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Practice</p>
        <h1 className="text-3xl font-extrabold tracking-tight">New session</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick your topics, difficulty, and mode — then go.
        </p>
      </header>
      <TopicSelectionForm
        defaultTopics={defaultTopics}
        defaultDifficulty={defaultDifficulty}
        topicCounts={topicCounts}
        hasCv={!!user.cvData}
        targetJobs={targetJobs}
      />
    </div>
  );
}
