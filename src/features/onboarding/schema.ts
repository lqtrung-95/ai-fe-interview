import { z } from 'zod';

export const ONBOARDING_TOPICS = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral',
] as const;

export const ONBOARDING_COMPANY_TYPES = [
  'Startup',
  'Fintech',
  'Big Tech',
  'Crypto / Web3',
  'General',
] as const;

export const ONBOARDING_ROLES = [
  'Frontend Engineer',
  'Senior Frontend Engineer',
  'Staff Frontend Engineer',
  'Full-stack Engineer',
] as const;

export const onboardingSchema = z.object({
  level: z.enum(['junior', 'mid', 'senior', 'staff']),
  targetRole: z.enum(ONBOARDING_ROLES),
  targetCompanyType: z.enum(ONBOARDING_COMPANY_TYPES),
  preferredTopics: z
    .array(z.enum(ONBOARDING_TOPICS))
    .min(1, 'Pick at least one topic'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
