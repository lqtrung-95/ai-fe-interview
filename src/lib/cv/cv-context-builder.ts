import type { CvData } from './cv-types';

const MAX_CHARS = 1_200;

/**
 * Formats a CvData object into a concise, LLM-readable context string (≤1 200 chars)
 * for injection into the question-generation prompt.
 *
 * Picks top 2 roles, top 8 skills, top 2 projects — hard-truncates at MAX_CHARS.
 * Returns null when cvData has no meaningful content.
 */
export function buildCvContext(cvData: CvData): string | null {
  const parts: string[] = [];

  // Roles (most recent first, already ordered by parse)
  const roles = cvData.roles.slice(0, 2);
  for (const role of roles) {
    const header = [role.title, 'at', role.company, role.duration ? `(${role.duration})` : '']
      .filter(Boolean)
      .join(' ');
    parts.push(`- ${header}`);
    for (const h of role.highlights.slice(0, 3)) {
      parts.push(`  • ${h}`);
    }
  }

  // Skills
  const skills = cvData.skills.slice(0, 8);
  if (skills.length > 0) {
    parts.push(`Skills: ${skills.join(', ')}`);
  }

  // Projects
  const projects = cvData.projects.slice(0, 2);
  for (const p of projects) {
    const tech = p.tech.length > 0 ? ` [${p.tech.slice(0, 4).join(', ')}]` : '';
    parts.push(`Project: ${p.name}${tech} — ${p.description}`);
  }

  if (parts.length === 0) return null;

  const text = `Candidate background:\n${parts.join('\n')}`;
  return text.slice(0, MAX_CHARS);
}
