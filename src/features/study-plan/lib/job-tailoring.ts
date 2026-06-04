import type { Level } from '@prisma/client';
import type { JdContext } from '@/features/target-jobs/target-job-types';

export const STUDY_PLAN_TOPICS = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral',
] as const;

export type StudyPlanTopic = (typeof STUDY_PLAN_TOPICS)[number];

export interface TailoredPlan {
  topics: StudyPlanTopic[];
  level: Level;
  rationale: string;
}

// Keyword sets for each topic (matched case-insensitively against stack + signals)
const TOPIC_KEYWORDS: Record<StudyPlanTopic, string[]> = {
  JavaScript: ['javascript', 'typescript', 'js', 'ts', 'es6', 'ecmascript', 'node'],
  React: ['react', 'next.js', 'nextjs', 'vue', 'angular', 'svelte', 'remix', 'jsx', 'tsx'],
  'Frontend System Design': [
    'system design', 'architecture', 'scalability', 'micro-frontend', 'microfrontend',
    'design system', 'design patterns', 'component library',
  ],
  'Web Performance': [
    'performance', 'core web vitals', 'lighthouse', 'optimization', 'bundle size',
    'lazy loading', 'caching', 'cdn', 'speed',
  ],
  'Browser & Web APIs': [
    'browser', 'dom', 'web api', 'websocket', 'service worker', 'pwa', 'web worker',
    'fetch', 'indexeddb', 'storage', 'accessibility', 'a11y',
  ],
  Testing: ['testing', 'jest', 'vitest', 'cypress', 'playwright', 'tdd', 'unit test', 'e2e', 'rtl'],
  Behavioral: ['behavioral', 'leadership', 'communication', 'culture', 'teamwork', 'mentoring', 'collaboration'],
};

const LEVEL_KEYWORDS: Record<Level, string[]> = {
  junior: ['junior', 'entry', 'entry-level', 'graduate', 'associate'],
  mid: ['mid', 'intermediate', 'midlevel', 'mid-level'],
  senior: ['senior', 'sr.', 'sr '],
  staff: ['staff', 'principal', 'lead', 'architect', 'distinguished'],
};

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function inferLevel(jdContext: JdContext): Level {
  const combined = [
    jdContext.level ?? '',
    jdContext.role,
    ...(jdContext.signals ?? []),
  ].join(' ').toLowerCase();

  for (const [level, keywords] of Object.entries(LEVEL_KEYWORDS) as [Level, string[]][]) {
    if (matchesAny(combined, keywords)) return level;
  }
  return 'mid';
}

/**
 * Deterministically maps a job's extracted JD context to study plan topics + level.
 * The jdContext was already AI-extracted on job creation — no further AI call needed.
 */
export function tailorToJob(jdContext: JdContext, currentLevel: Level): TailoredPlan {
  const haystack = [
    ...(jdContext.requiredStack ?? []),
    ...(jdContext.signals ?? []),
    jdContext.role,
    jdContext.domain,
  ].join(' ');

  const matched = (Object.entries(TOPIC_KEYWORDS) as [StudyPlanTopic, string[]][])
    .filter(([, keywords]) => matchesAny(haystack, keywords))
    .map(([topic]) => topic);

  // Always include JavaScript as the base topic for frontend roles
  const topics: StudyPlanTopic[] = matched.length > 0
    ? [...new Set(['JavaScript' as StudyPlanTopic, ...matched])]
    : ['JavaScript', 'React'];

  const level = inferLevel(jdContext);

  const stackList = jdContext.requiredStack?.length
    ? jdContext.requiredStack.slice(0, 4).join(', ')
    : jdContext.domain;

  const roleLabel = [jdContext.company, jdContext.role].filter(Boolean).join(' — ');

  const rationale = [
    `Tailored for: ${roleLabel}.`,
    stackList ? `Required stack: ${stackList}.` : null,
    `Focusing on ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? ` + ${topics.length - 3} more` : ''} at ${level} level.`,
  ].filter(Boolean).join(' ');

  return { topics, level, rationale };
}
