/**
 * DB layer for the study plan feature.
 * All functions are server-only (called from RSC or server actions).
 */

import 'server-only';
import type { Level } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { listStudyQuestions } from '@/features/study/server/study-service';
import { applySmTwoReview } from '../lib/sm2-algorithm';
import {
  filterAndSort,
  buildSchedule,
  computeStats,
  type ScheduledQuestion,
  type PlanStats,
} from './study-plan-scheduler';

export interface StudyPlanConfig {
  topics: string[];
  level: Level;
  prepWeeks: number;
}

export interface StudyPlanWithStats {
  id: string;
  userId: string;
  topics: string[];
  level: Level;
  prepWeeks: number;
  startedAt: Date;
  schedule: ScheduledQuestion[];
  studiedIds: Set<string>;
  /** Questions where SM-2 nextReviewAt is today or in the past. */
  dueForReview: ScheduledQuestion[];
  stats: PlanStats;
}

/** Fetch the user's current plan + computed schedule + SM-2 review queue. */
export async function getUserStudyPlan(userId: string): Promise<StudyPlanWithStats | null> {
  const plan = await prisma.studyPlan.findUnique({
    where: { userId },
    include: {
      progress: {
        select: {
          seedQuestionId: true,
          nextReviewAt: true,
        },
      },
    },
  });
  if (!plan) return null;

  const allQuestions = await listStudyQuestions();
  const sorted = filterAndSort(allQuestions, plan.topics, plan.level);
  const schedule = buildSchedule(sorted, plan.prepWeeks);
  const studiedIds = new Set(plan.progress.map((p) => p.seedQuestionId));

  // Build review queue: questions whose nextReviewAt is today or past.
  const now = new Date();
  const dueIds = new Set(
    plan.progress
      .filter((p) => p.nextReviewAt && p.nextReviewAt <= now)
      .map((p) => p.seedQuestionId),
  );
  const dueForReview: ScheduledQuestion[] = allQuestions
    .filter((q) => dueIds.has(q.id))
    .map((q) => ({ question: q, dayIndex: -1 }));

  const stats = computeStats(schedule, studiedIds, plan.startedAt, plan.prepWeeks);

  return { ...plan, schedule, studiedIds, dueForReview, stats };
}

/** Create a new plan (or replace an existing one — one plan per user). */
export async function upsertStudyPlan(userId: string, config: StudyPlanConfig) {
  return prisma.studyPlan.upsert({
    where: { userId },
    update: {
      topics: config.topics,
      level: config.level,
      prepWeeks: config.prepWeeks,
      // Reset startedAt so the schedule restarts from today.
      startedAt: new Date(),
    },
    create: {
      userId,
      topics: config.topics,
      level: config.level,
      prepWeeks: config.prepWeeks,
    },
  });
}

/**
 * Toggle studied state for a question.
 * - Not studied → mark studied; applies SM-2 (quality=4) and schedules next review.
 * - Already studied → un-study; deletes the progress row (full SM-2 reset).
 *
 * Returns true = now studied, false = un-studied.
 */
export async function toggleStudied(
  userId: string,
  seedQuestionId: string,
): Promise<boolean> {
  const plan = await prisma.studyPlan.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!plan) throw new Error('No active study plan');

  const existing = await prisma.studyPlanProgress.findUnique({
    where: { planId_seedQuestionId: { planId: plan.id, seedQuestionId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.studyPlanProgress.delete({ where: { id: existing.id } });
    return false;
  }

  const sm2 = applySmTwoReview(null, 4);
  await prisma.studyPlanProgress.create({
    data: {
      planId: plan.id,
      userId,
      seedQuestionId,
      repetitions: sm2.repetitions,
      interval: sm2.interval,
      easeFactor: sm2.easeFactor,
      nextReviewAt: sm2.nextReviewAt,
    },
  });
  return true;
}

/**
 * Advance the SM-2 review for an already-studied question.
 * Called when the user taps "Reviewed" on a due card in the study plan.
 * If the question has no progress row yet, it creates one (same as first study).
 */
export async function markReviewed(
  userId: string,
  seedQuestionId: string,
): Promise<void> {
  const plan = await prisma.studyPlan.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!plan) throw new Error('No active study plan');

  const existing = await prisma.studyPlanProgress.findUnique({
    where: { planId_seedQuestionId: { planId: plan.id, seedQuestionId } },
    select: {
      id: true,
      repetitions: true,
      interval: true,
      easeFactor: true,
    },
  });

  if (!existing) {
    // Treat as first study
    const sm2 = applySmTwoReview(null, 4);
    await prisma.studyPlanProgress.create({
      data: {
        planId: plan.id,
        userId,
        seedQuestionId,
        repetitions: sm2.repetitions,
        interval: sm2.interval,
        easeFactor: sm2.easeFactor,
        nextReviewAt: sm2.nextReviewAt,
      },
    });
    return;
  }

  const sm2 = applySmTwoReview(existing, 4);
  await prisma.studyPlanProgress.update({
    where: { id: existing.id },
    data: {
      studiedAt: new Date(),
      repetitions: sm2.repetitions,
      interval: sm2.interval,
      easeFactor: sm2.easeFactor,
      nextReviewAt: sm2.nextReviewAt,
    },
  });
}

/** Get the set of studied question IDs for a given user (lightweight, for detail page). */
export async function getStudiedIdsForUser(userId: string): Promise<Set<string>> {
  const plan = await prisma.studyPlan.findUnique({
    where: { userId },
    select: {
      id: true,
      progress: { select: { seedQuestionId: true } },
    },
  });
  if (!plan) return new Set();
  return new Set(plan.progress.map((p) => p.seedQuestionId));
}

/**
 * Lightweight status check for a single question detail page.
 * Avoids loading the full schedule — only checks plan existence and progress.
 */
export async function getStudyPlanStatus(
  userId: string,
): Promise<{ hasPlan: boolean; studiedIds: Set<string> }> {
  const plan = await prisma.studyPlan.findUnique({
    where: { userId },
    select: { id: true, progress: { select: { seedQuestionId: true } } },
  });
  if (!plan) return { hasPlan: false, studiedIds: new Set() };
  return {
    hasPlan: true,
    studiedIds: new Set(plan.progress.map((p) => p.seedQuestionId)),
  };
}
