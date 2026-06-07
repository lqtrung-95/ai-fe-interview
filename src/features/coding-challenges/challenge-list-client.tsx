'use client';

import { useSearchParams } from 'next/navigation';
import { ChallengeFilters } from './challenge-filters';
import { ChallengeCard } from './challenge-card';
import type { ChallengeWithStatus } from './types';

interface Props {
  challenges: ChallengeWithStatus[];
}

export function ChallengeListClient({ challenges }: Props) {
  const params = useSearchParams();
  const activeDiff = params.get('difficulty') ?? '';
  const activeTopic = params.get('topic') ?? '';

  const filtered = challenges.filter((ch) => {
    if (activeDiff && ch.difficulty !== activeDiff) return false;
    if (activeTopic && ch.topic !== activeTopic) return false;
    return true;
  });

  const topics = [...new Set(challenges.map((ch) => ch.topic))].sort();

  return (
    <div className="space-y-6">
      <ChallengeFilters
        topics={topics}
        totalCount={challenges.length}
        filteredCount={filtered.length}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No challenges match your filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ch) => (
            <ChallengeCard key={ch.id} challenge={ch} />
          ))}
        </div>
      )}
    </div>
  );
}
