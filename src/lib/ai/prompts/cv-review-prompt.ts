import 'server-only';
import type { CvData } from '@/lib/cv/cv-types';

/**
 * Prompt builder for LLM CV review.
 * Returns structured JSON feedback on ATS compatibility, impact, verbs,
 * frontend-specific improvements, and top strengths.
 */
export function buildCvReviewPrompt(cvData: CvData): { system: string; user: string } {
  const system = [
    'You are a senior frontend engineering recruiter reviewing a candidate\'s CV.',
    'Provide structured, actionable feedback. Return ONLY valid JSON — no markdown fences, no preamble.',
    '',
    'Required JSON schema:',
    '{',
    '  "overallScore": number (0-10),',
    '  "topStrengths": string[] (2-3 things done well — be specific),',
    '  "atsSummary": string (2-3 sentences on ATS compatibility),',
    '  "atsKeywordsToAdd": string[] (up to 8 specific missing tech terms),',
    '  "impactFeedback": string (feedback on quantification — are achievements measurable?),',
    '  "verbFeedback": string (weak verbs found + stronger alternatives),',
    '  "frontendSuggestions": string[] (3-6 actionable frontend-specific improvements)',
    '}',
    '',
    'Focus exclusively on frontend engineering roles.',
    'Be direct and specific — avoid vague advice like "add more details".',
    'For atsKeywordsToAdd, only include terms genuinely missing from the CV.',
  ].join('\n');

  // Format CV data as readable text
  const roleLines = cvData.roles
    .map(
      (r) =>
        `  - ${r.title} at ${r.company}${r.duration ? ` (${r.duration})` : ''}\n` +
        r.highlights.map((h) => `    • ${h}`).join('\n'),
    )
    .join('\n');

  const projectLines = cvData.projects
    .map(
      (p) =>
        `  - ${p.name}${p.tech.length ? ` [${p.tech.join(', ')}]` : ''}: ${p.description}`,
    )
    .join('\n');

  const user = [
    'CV data to review:',
    '',
    cvData.summary ? `Summary: ${cvData.summary}\n` : '',
    'Roles:',
    roleLines || '  (none listed)',
    '',
    'Skills:',
    `  ${cvData.skills.join(', ') || '(none listed)'}`,
    '',
    cvData.projects.length > 0 ? `Projects:\n${projectLines}` : '',
    cvData.education ? `\nEducation: ${cvData.education}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
