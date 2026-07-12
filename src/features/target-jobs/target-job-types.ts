export interface JdContext {
  role: string;
  company?: string;
  level?: string;
  domain: string;
  requiredStack: string[];
  // Concrete work items extracted from the JD — question material.
  responsibilities?: string[];
  signals: string[];
}

/** Formats extracted JD context into a compact prompt string (≤900 chars). */
export function formatJdContext(ctx: JdContext): string {
  const lines = [
    `Target role: ${ctx.role}`,
    ctx.company ? `Company: ${ctx.company}` : null,
    `Domain: ${ctx.domain}`,
    ctx.requiredStack.length ? `Required stack: ${ctx.requiredStack.join(', ')}` : null,
    ctx.responsibilities?.length
      ? `Key responsibilities:\n${ctx.responsibilities.map((r) => `- ${r}`).join('\n')}`
      : null,
    ctx.signals.length ? `Culture signals: ${ctx.signals.join(', ')}` : null,
  ];
  return lines.filter(Boolean).join('\n').slice(0, 900);
}

// ----------------------------------------------------------------------------
// Session-config suggestions derived from the extracted JD. Pure functions —
// safe to call from server components; results are passed to the client form.
// ----------------------------------------------------------------------------

/** Maps JD stack/domain keywords to the app's canonical interview topics. */
const STACK_TOPIC_RULES: ReadonlyArray<[RegExp, string]> = [
  [/react|next\.?js|redux|remix|zustand|tanstack/i, 'React'],
  [/typescript|javascript|\bnode\b|\bes\d/i, 'JavaScript'],
  [/perform|lighthouse|web vitals|\blcp\b|\binp\b|\bcls\b|bundle|webpack|vite/i, 'Web Performance'],
  [/graphql|websocket|micro.?frontend|architect|design system|scalab|\bssr\b|\bapi\b/i, 'Frontend System Design'],
  [/jest|cypress|playwright|vitest|\btest/i, 'Testing'],
  [/\bcss\b|\bhtml\b|\bdom\b|browser|accessib|a11y|wcag/i, 'Browser & Web APIs'],
];

/**
 * Suggests interview topics for a saved job by matching its required stack,
 * domain, and responsibilities against topic keywords. Empty when nothing matches.
 */
export function suggestTopicsFromJd(ctx: JdContext): string[] {
  const haystack = [
    ...ctx.requiredStack,
    ctx.domain,
    ...(ctx.responsibilities ?? []),
  ].join(' · ');
  const topics: string[] = [];
  for (const [pattern, topic] of STACK_TOPIC_RULES) {
    if (pattern.test(haystack) && !topics.includes(topic)) topics.push(topic);
  }
  return topics;
}

/** Normalizes the JD's free-text seniority into a session difficulty, if inferable. */
export function suggestDifficultyFromJd(ctx: JdContext): 'junior' | 'mid' | 'senior' | null {
  const level = ctx.level?.toLowerCase() ?? '';
  if (/senior|staff|lead|principal/.test(level)) return 'senior';
  if (/junior|entry|graduate|intern/.test(level)) return 'junior';
  if (/mid/.test(level)) return 'mid';
  return null;
}
