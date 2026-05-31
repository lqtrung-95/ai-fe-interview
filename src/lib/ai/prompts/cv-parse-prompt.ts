import 'server-only';

/**
 * Prompt builder for LLM CV extraction.
 * Instructs the model to return structured JSON matching CvData.
 *
 * Input is capped at 8 000 characters so the prompt stays within cheap-tier
 * context limits — sufficient for any typical résumé.
 */

const MAX_CHARS = 8_000;

export function buildCvParsePrompt(rawText: string): { system: string; user: string } {
  const truncated = rawText.slice(0, MAX_CHARS);

  const system = [
    'You are a CV parser for a frontend engineering interview preparation application.',
    'Extract structured data from the provided résumé text.',
    'Return ONLY valid JSON with no markdown fences, no preamble, no trailing text.',
    '',
    'Required JSON schema:',
    '{',
    '  "summary": string | null,        // ≤3 sentences from the profile/summary section; null if absent',
    '  "roles": [                        // all work experience entries',
    '    {',
    '      "company": string,',
    '      "title": string,',
    '      "duration": string | null,   // e.g. "2022–2024"; null if not stated',
    '      "highlights": string[]       // 2-4 bullets, technical focus, ≤15 words each',
    '    }',
    '  ],',
    '  "skills": string[],              // technical only: frameworks, languages, tools, platforms',
    '  "projects": [',
    '    {',
    '      "name": string,',
    '      "description": string,       // 1-2 sentences',
    '      "tech": string[]',
    '    }',
    '  ],',
    '  "education": string | null       // "Degree, Institution, Year" on one line; null if absent',
    '}',
    '',
    'Rules:',
    '- Omit personal info (phone, address, photo, links).',
    '- Omit soft skills (communication, teamwork, etc.).',
    '- Skills must be concrete technologies only.',
    '- If the résumé is not in English, translate all output to English.',
    '- Return an empty array [] for any list field if no data is found.',
  ].join('\n');

  const user = `Résumé text:\n\n${truncated}`;

  return { system, user };
}
