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
