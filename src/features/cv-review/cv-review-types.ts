import { z } from 'zod';

export const cvReviewSchema = z.object({
  overallScore:        z.number().min(0).max(10),
  topStrengths:        z.array(z.string()).min(1).max(5),
  atsSummary:          z.string(),
  atsKeywordsToAdd:    z.array(z.string()).max(10),
  impactFeedback:      z.string(),
  verbFeedback:        z.string(),
  frontendSuggestions: z.array(z.string()).min(1).max(8),
});

export type CvReview = z.infer<typeof cvReviewSchema>;
