export interface JdContext {
  role: string;
  company?: string;
  level?: string;
  domain: string;
  requiredStack: string[];
  signals: string[];
}

/** Formats extracted JD context into a compact prompt string (~200–400 chars). */
export function formatJdContext(ctx: JdContext): string {
  const lines = [
    `Target role: ${ctx.role}`,
    ctx.company ? `Company: ${ctx.company}` : null,
    `Domain: ${ctx.domain}`,
    ctx.requiredStack.length ? `Required stack: ${ctx.requiredStack.join(', ')}` : null,
    ctx.signals.length ? `Culture signals: ${ctx.signals.join(', ')}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}
