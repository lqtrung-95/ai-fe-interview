// Shared types for the seed extraction pipeline.
// Output shape mirrors Prisma `SeedQuestion` (lowercase enum strings).

export type Difficulty = 'junior' | 'mid' | 'senior';
export type QuestionType = 'conceptual' | 'debugging' | 'system_design' | 'behavioral' | 'tradeoff';

export interface SeedQuestion {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  expectedPoints: string[];
  followUps: string[];
  rubric: Record<string, unknown>;
  tags: string[];
  sourceFile: string;
  // Study content: populated from source HTML or LLM generation.
  childExplanation?: string;    // ELI5 plain-text, English
  detailedExplanation?: string; // Body HTML translated to English
  diagramSvg?: string;          // Raw <svg>...</svg> string (hand-crafted, priority)
  diagramMermaid?: string;      // Mermaid flowchart source (LLM-generated, fallback)
}

// PRD §7.3 canonical topic names.
export const CANONICAL_TOPICS = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral',
] as const;
export type CanonicalTopic = (typeof CANONICAL_TOPICS)[number];

// Maps from raw category strings found in the resource HTML files
// (Vietnamese + abbreviated) to canonical topic names.
export const TOPIC_ALIASES: Record<string, CanonicalTopic> = {
  // fe-prep.html DATA_META categories (Vietnamese)
  JavaScript: 'JavaScript',
  React: 'React',
  'Hiệu năng': 'Web Performance',
  'Kiến trúc': 'Frontend System Design',
  'Trình duyệt': 'Browser & Web APIs',
  'Kiểm thử': 'Testing',
  'Hành vi': 'Behavioral',
  // English aliases (fun-xyz-prep.html, sys-design-prep-v1.html)
  Performance: 'Web Performance',
  'System Design': 'Frontend System Design',
  'Frontend System Design': 'Frontend System Design',
  Architecture: 'Frontend System Design',
  Browser: 'Browser & Web APIs',
  'Web APIs': 'Browser & Web APIs',
  Testing: 'Testing',
  Behavioral: 'Behavioral',
  'Web3': 'JavaScript', // fold Web3-specific into JavaScript with web3 tag
};
