/**
 * Shared badge styling/label maps for the public question pages.
 * Mirrors the look of the gated question-bank detail page.
 */

export const DIFFICULTY_BADGE_CLASSES: Record<string, string> = {
  junior: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  mid:    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  senior: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  conceptual:    'Conceptual',
  debugging:     'Debugging',
  system_design: 'System design',
  behavioral:    'Behavioral',
  tradeoff:      'Trade-off',
};
