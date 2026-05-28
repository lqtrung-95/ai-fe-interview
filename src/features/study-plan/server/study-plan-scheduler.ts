/**
 * Pure computation — no DB calls.
 * Turns a list of seed questions + plan config into a day-indexed schedule.
 */

import type { Level } from '@prisma/client';
import type { StudyQuestionSummary } from '@/features/study/server/study-service';

export interface ScheduledQuestion {
  question: StudyQuestionSummary;
  dayIndex: number; // 0-based day within the plan (0 = first day)
}

export interface PlanStats {
  totalQuestions: number;
  totalDays: number;
  currentDayIndex: number;    // how many days since startedAt (clamped to totalDays-1)
  questionsToday: number;
  questionsStudied: number;
  questionsOverdue: number;   // from past days, not yet studied
  percentComplete: number;
}

// Maps level → which difficulty bands to include.
const LEVEL_DIFFICULTIES: Record<Level, string[]> = {
  junior: ['junior', 'mid'],
  mid:    ['mid', 'senior'],
  senior: ['senior'],
  staff:  ['senior'],
};

const DIFFICULTY_ORDER: Record<string, number> = { junior: 0, mid: 1, senior: 2 };

/**
 * Filter and sort seed questions appropriate for a given level and topics.
 * Order: topic (alphabetical) → difficulty (ascending) → question text.
 */
export function filterAndSort(
  questions: StudyQuestionSummary[],
  topics: string[],
  level: Level,
): StudyQuestionSummary[] {
  const allowedDiffs = new Set(LEVEL_DIFFICULTIES[level]);
  return questions
    .filter((q) => topics.includes(q.topic) && allowedDiffs.has(q.difficulty))
    .sort((a, b) => {
      if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
      const dA = DIFFICULTY_ORDER[a.difficulty] ?? 1;
      const dB = DIFFICULTY_ORDER[b.difficulty] ?? 1;
      if (dA !== dB) return dA - dB;
      return a.question.localeCompare(b.question);
    });
}

/**
 * Spread questions evenly across the plan's days.
 * If more questions than days, multiple questions share a day.
 * If fewer questions than days, some days are empty (returned list has gaps).
 */
export function buildSchedule(
  questions: StudyQuestionSummary[],
  prepWeeks: number,
): ScheduledQuestion[] {
  const totalDays = prepWeeks * 7;
  if (questions.length === 0) return [];

  const perDay = Math.max(1, Math.ceil(questions.length / totalDays));
  return questions.map((question, i) => ({
    question,
    dayIndex: Math.min(Math.floor(i / perDay), totalDays - 1),
  }));
}

/** How many calendar days have passed since the plan started (0-based). */
export function getCurrentDayIndex(startedAt: Date, prepWeeks: number): number {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 86_400_000);
  return Math.max(0, Math.min(elapsed, prepWeeks * 7 - 1));
}

/**
 * Compute display stats for the plan header.
 */
export function computeStats(
  schedule: ScheduledQuestion[],
  studiedIds: Set<string>,
  startedAt: Date,
  prepWeeks: number,
): PlanStats {
  const totalDays = prepWeeks * 7;
  const currentDayIndex = getCurrentDayIndex(startedAt, prepWeeks);

  const todayItems = schedule.filter((s) => s.dayIndex === currentDayIndex);
  const overdueItems = schedule.filter(
    (s) => s.dayIndex < currentDayIndex && !studiedIds.has(s.question.id),
  );

  return {
    totalQuestions: schedule.length,
    totalDays,
    currentDayIndex,
    questionsToday: todayItems.length,
    questionsStudied: studiedIds.size,
    questionsOverdue: overdueItems.length,
    percentComplete:
      schedule.length > 0 ? Math.round((studiedIds.size / schedule.length) * 100) : 0,
  };
}
