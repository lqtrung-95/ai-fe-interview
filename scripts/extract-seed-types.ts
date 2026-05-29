// Shared types for the seed extraction pipeline.
// Output shape mirrors Prisma `SeedQuestion` (lowercase enum strings).

export type Difficulty = 'junior' | 'mid' | 'senior';
export type QuestionType = 'conceptual' | 'debugging' | 'system_design' | 'behavioral' | 'tradeoff';

// ── Diagram spec — rendered to SVG by diagram-spec-renderer.ts ───────────────

// Semantic color palette. Each value maps to a CSS variable (--dg-{color}).
export type DiagramColor = 'teal' | 'green' | 'orange' | 'purple' | 'red' | 'blue' | 'pink' | 'amber' | 'cyan';

export interface DiagramNode {
  id: string;           // short identifier, e.g. "html", "dom"
  label: string;        // ≤3 words, displayed inside the node
  sublabel?: string;    // ≤4 words, smaller text below label
  color?: DiagramColor; // semantic color; omit for neutral gray box
}
export interface DiagramEdge {
  from: string;        // node id
  to: string;          // node id
  label?: string;      // ≤2 words on the edge
  dashed?: boolean;    // for optional / weak relationships
}
export interface DiagramGroup {
  label: string;           // ≤3 words for the group label
  nodeIds: string[];       // ids of nodes that belong to this group
  color?: DiagramColor;    // colors the group border + label
}
export interface DiagramSpec {
  direction: 'LR' | 'TD';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups?: DiagramGroup[];
  caption?: string;  // ≤10 words, rendered below the diagram
}

// ── Quiz — shown as interactive MCQ or T/F at the bottom of the study card ───
export interface QuizData {
  format: 'mcq' | 'tf';
  question: string;
  options: string[];    // exactly 4 for mcq, exactly ["True","False"] for tf
  answer: number;       // 0-indexed correct option
  explanation: string;  // 1-2 sentences
}

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
  diagramSvg?: string;          // Raw <svg>...</svg> string (rendered from spec or hand-crafted)
  diagramMermaid?: string;      // Legacy Mermaid source — kept for backward-compat
  diagramSpec?: DiagramSpec;    // Source spec used to generate diagramSvg (not stored in DB)
  quiz?: QuizData;              // Interactive quick-check question (stored in DB as JSON string)
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
