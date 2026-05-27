import 'server-only';
import type { SummaryInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.4 — Session summary. Consumes per-answer aggregates, not raw text. */
export function buildSummaryPrompt(input: SummaryInput): {
  system: string;
  user: string;
} {
  const system = [
    'You are an AI interview coach summarizing a completed practice session.',
    'Tone: supportive but honest. Lean on the data — do not invent strengths.',
    'Return strict JSON:',
    '{ overallScore: number (1-5), strongAreas: string[], weakAreas: string[],',
    '  repeatedMistakes: string[], recommendedTopics: string[], actionItems: string[] (1-5 concrete next steps) }',
    'Each array max 5 items, items short (one phrase).',
  ].join('\n');

  const profile = input.userProfile;
  const answerLines = input.perAnswer
    .map(
      (a, i) =>
        `${i + 1}. [${a.topic} · ${a.difficulty}] score=${a.overallScore.toFixed(1)} · missing: ${
          a.missingPoints.length ? a.missingPoints.map((p) => sanitize(p, 100)).join('; ') : 'none flagged'
        }\n   Q: ${sanitize(a.question, 200)}`
    )
    .join('\n');

  const user = [
    `User level: ${profile.level}`,
    profile.targetRole ? `Target role: ${profile.targetRole}` : null,
    profile.targetCompanyType ? `Company type: ${profile.targetCompanyType}` : null,
    '',
    `Session answers (${input.perAnswer.length}):`,
    answerLines,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
