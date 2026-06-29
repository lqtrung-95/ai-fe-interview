export interface OverviewMetrics {
  totalSessions: number;
  completedSessions: number;
  totalQuestionsAnswered: number;
  averageScore: number | null;
  bestTopic: { topic: string; score: number } | null;
  weakestTopic: { topic: string; score: number } | null;
  currentStreakDays: number;
}

export interface ScoreTrendPoint {
  date: string; // ISO yyyy-mm-dd
  avgScore: number;
}

export interface TopicBreakdownEntry {
  topic: string;
  avgScore: number;
  answers: number;
}

export interface DimensionAverage {
  dimension:
    | 'correctness'
    | 'completeness'
    | 'clarity'
    | 'depth'
    | 'tradeoffThinking'
    | 'communication';
  label: string;
  avgScore: number;
}

import type { Level } from '@prisma/client';

export interface RecommendedTopic {
  topic: string;
  reason: string;
  difficulty: Level;
}

/** A topic where the user consistently scores low, with a specific gap from their feedback. */
export interface TopicWeakArea {
  topic: string;
  avgScore: number;
  answers: number;
  /** The most recently flagged "what was missing" from AI feedback for this topic. */
  specificGap: string | null;
}

/** Shape returned by GET /api/dashboard and consumed by useDashboardQuery. */
export interface DashboardData {
  overview: OverviewMetrics;
  trend: ScoreTrendPoint[];
  topics: TopicBreakdownEntry[];
  weakAreas: TopicWeakArea[];
  recommendations: RecommendedTopic[];
  isPro: boolean;
  userName: string | null;
  targetInterviewDate: string | null; // ISO string
  // Engagement features
  readiness: { topics: { topic: string; readiness: number; avgScore: number | null; answers: number }[]; overall: number };
  weeklyComparison: { thisWeekAvg: number | null; lastWeekAvg: number | null; delta: number | null; sessionsThisWeek: number };
  dailyChallenge: { topic: string; difficulty: string; question: string } | null;
  codingStats: { solved: number; total: number };
  review: {
    dueCount: number;
    reviewedToday: number;
    dailyGoal: number;
    currentStreak: number;
    longestStreak: number;
  };
}
