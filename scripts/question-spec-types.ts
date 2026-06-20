/**
 * Shared shape for hand-authored question specs consumed by
 * generate-new-questions.ts. The spec defines the question itself;
 * the LLM generates the study content (ELI5, detailed notes, quiz).
 */
export interface QuestionSpec {
  key: string;
  file: string;
  topic: string;
  subtopic: string;
  difficulty: 'mid' | 'senior';
  type: 'conceptual' | 'coding' | 'system_design' | 'tradeoff' | 'behavioral';
  question: string;
  tags: string[];
}
