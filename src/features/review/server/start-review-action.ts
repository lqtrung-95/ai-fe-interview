'use server';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getDueTopics } from './review-queue-service';

export type StartReviewResult =
  | { ok: true; sessionId: string }
  | { ok: false; code: 'nothing_due' };

const MIN_REVIEW_TOPICS = 3;

/** User seniority → question difficulty (staff has no own tier → senior). */
function levelToDifficulty(level: 'junior' | 'mid' | 'senior' | 'staff'): 'junior' | 'mid' | 'senior' {
  return level === 'staff' ? 'senior' : level;
}

/**
 * Starts a review session pre-seeded with the user's due topics. Reuses the
 * standard practice pipeline — no special session mode. The difficulty is taken
 * from the weakest due topic's last difficulty (fallback: user level), and each
 * answered question advances the spaced-repetition schedule via persistFeedback.
 */
export async function startReview(): Promise<StartReviewResult> {
  const user = await requireUser();

  const due = await getDueTopics(user.id, Math.max(user.dailyGoal, MIN_REVIEW_TOPICS));
  if (due.length === 0) return { ok: false, code: 'nothing_due' };

  const topics = due.map((d) => d.topic);
  // Weakest due topic drives difficulty so review meets the user where they
  // struggle; fall back to the user's level (staff maps to senior questions).
  const difficulty = due[0].lastDifficulty ?? levelToDifficulty(user.level);

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      mode: 'standard',
      difficulty,
      topics,
      label: 'Daily review',
    },
    select: { id: true },
  });

  return { ok: true, sessionId: session.id };
}
