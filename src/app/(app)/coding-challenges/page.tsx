import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { getChallengesWithStatus } from '@/features/coding-challenges/server/get-challenges-with-status';
import { ChallengeListClient } from '@/features/coding-challenges/challenge-list-client';

export const metadata: Metadata = { title: 'Coding Challenges' };

export default async function CodingChallengesPage() {
  const user = await getCurrentUser();
  const challenges = await getChallengesWithStatus(user?.id);

  return (
    <div className="app-page mx-auto max-w-5xl px-6 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Practice</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Coding Challenges</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Practice real JavaScript problems asked in frontend interviews. Write code, run tests, get AI feedback.
        </p>
      </div>

      <Suspense>
        <ChallengeListClient challenges={challenges} />
      </Suspense>
    </div>
  );
}
