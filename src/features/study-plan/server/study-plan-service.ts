/**
 * DB layer for the study plan feature.
 * All functions are server-only (called from RSC or server actions).
 */

import 'server-only';
import type { Level } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { listStudyQuestions } from '@/features/study/server/study-service';
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
  stats: PlanStats;
}

/** Fetch the user's current plan + computed schedule + progress. */
export async function getUserStudyPlan(userId: string): Promise<StudyPlanWithStats | null> {
  const plan = await prisma.studyPlan.findUnique({
    where: { userId },
    include: { progress: { select: { seedQuestionId: true } } },
  });
  if (!plan) return null;

  const allQuestions = await listStudyQuestions();
  const sorted = filterAndSort(allQuestions, plan.topics, plan.level);
  const schedule = buildSchedule(sorted, plan.prepWeeks);
  const studiedIds = new Set(plan.progress.map((p) => p.seedQuestionId));
  const stats = computeStats(schedule, studiedIds, plan.startedAt, plan.prepWeeks);

  return { ...plan, schedule, studiedIds, stats };
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

/** Toggle studied state for a question. Returns true = now studied, false = un-studied. */
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

  await prisma.studyPlanProgress.create({
    data: { planId: plan.id, userId, seedQuestionId },
  });
  return true;
}

/** Get the set of studied question IDs for a given plan (lightweight, for detail page). */
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
