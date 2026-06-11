/**
 * Slug generation for public question URLs (/questions/[slug]).
 *
 * Slugs are STABLE: assigned once (backfill script or first seed insert) and
 * never recomputed when question text is edited — URL permanence beats slug
 * freshness. Shared by scripts/backfill-question-slugs.ts and prisma/seed.ts.
 */

const MAX_SLUG_LENGTH = 80;

/** kebab-case question text: lowercase, strip punctuation/diacritics, truncate ≤80 chars at a word boundary. */
export function slugifyQuestionText(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics after NFKD
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-');
  if (base.length <= MAX_SLUG_LENGTH) return base;
  const cut = base.slice(0, MAX_SLUG_LENGTH + 1);
  const lastDash = cut.lastIndexOf('-');
  const truncated = lastDash > 0 ? cut.slice(0, lastDash) : base.slice(0, MAX_SLUG_LENGTH);
  return truncated.replace(/-+$/, '');
}

/**
 * Returns a slug unique against `taken`, appending -2, -3, … on collision.
 * Mutates `taken` by adding the chosen slug.
 */
export function uniqueQuestionSlug(text: string, taken: Set<string>): string {
  const base = slugifyQuestionText(text) || 'question';
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}
