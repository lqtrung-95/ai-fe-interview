import type { EvaluateOutput } from '@/features/interview/ai-schemas';

export interface FeedbackPayload extends EvaluateOutput {
  id?: string;
  answerId?: string;
}
