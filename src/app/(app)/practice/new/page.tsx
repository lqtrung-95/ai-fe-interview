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
  const requestedDifficulty = params.difficulty && VALID_DIFFICULTIES.includes(params.difficulty)
    ? (params.difficulty as SessionDifficulty)
    : null;

  const defaultTopics = requestedTopic ? [requestedTopic] : user.preferredTopics;
  const defaultDifficulty: SessionDifficulty = toSessionDifficulty(requestedDifficulty ?? user.level);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
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
      />
    </div>
  );
}
