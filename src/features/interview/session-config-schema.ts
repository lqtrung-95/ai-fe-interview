import { z } from 'zod';
import { ONBOARDING_TOPICS } from '@/features/onboarding/schema';

export const SESSION_MODES = [
  { value: 'quick', label: 'Quick practice', meta: '3 questions · 10 min' },
  { value: 'standard', label: 'Standard mock', meta: '5 questions · 25 min' },
  { value: 'deep_coaching', label: 'Deep coaching', meta: '5 questions · detailed coaching' },
] as const;

export const SESSION_DIFFICULTIES = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
] as const;

export const createSessionSchema = z.object({
  mode: z.enum(['quick', 'standard', 'deep_coaching']),
  difficulty: z.enum(['junior', 'mid', 'senior']),
  topics: z.array(z.enum(ONBOARDING_TOPICS)).min(1, 'Pick at least one topic'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
