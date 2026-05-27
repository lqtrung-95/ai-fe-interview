import { z } from 'zod';
import { ONBOARDING_TOPICS } from '@/features/onboarding/schema';

/**
 * URL-driven filter state for the history page.
 * Empty/invalid values silently coerce to "no filter" so the page can always render.
 */

const emptyToUndefined = (v: unknown) => (v === '' || v === undefined || v === null ? undefined : v);

export const historyFiltersSchema = z.object({
  topic: z.preprocess(emptyToUndefined, z.enum(ONBOARDING_TOPICS).optional()),
  minScore: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(5).optional()
  ),
  from: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional()
  ),
  to: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional()
  ),
});

export type HistoryFilters = z.infer<typeof historyFiltersSchema>;

export function parseHistoryFilters(raw: Record<string, string | string[] | undefined>): HistoryFilters {
  const parsed = historyFiltersSchema.safeParse({
    topic: pick(raw.topic),
    minScore: pick(raw.minScore),
    from: pick(raw.from),
    to: pick(raw.to),
  });
  return parsed.success ? parsed.data : {};
}

function pick(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
