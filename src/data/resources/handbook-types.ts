// Types for the Frontend System Design handbook.
// Mirror the shape written by scripts/extract-resource-handbook.ts.

export type CalloutVariant = 'tip' | 'warn' | 'key' | 'interview';
export type PillVariant = 'good' | 'bad' | 'neutral';

export type ContentBlock =
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'p'; html: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'pre'; code: string; label?: string }
  | { type: 'callout'; variant: CalloutVariant; title: string; body: string }
  | { type: 'diagram'; svg: string; caption?: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'quiz'; question: string; options: string[]; answer: number; explanation: string }
  | { type: 'flashcards'; items: { front: string; back: string }[] }
  | { type: 'pills'; items: { text: string; variant: PillVariant }[] }
  | { type: 'cards'; items: { icon: string; title: string; body: string }[] };

export interface HandbookSection {
  id: string;     // HTML anchor, e.g. "intro"
  num: string;    // e.g. "01 — FOUNDATION"
  title: string;  // translated h2
  intro: string;  // translated topic-intro paragraph
  blocks: ContentBlock[];
}

export interface NavItem {
  id: string;      // matches section id
  label: string;   // translated nav link text
  group?: string;  // e.g. "Foundation", "Core", "Case Studies"
}

export interface HandbookStat {
  value: string;
  label: string;
}

export interface HandbookMeta {
  title: string;
  description: string;
  stats: HandbookStat[];
}

export interface HandbookData {
  meta: HandbookMeta;
  nav: NavItem[];
  sections: HandbookSection[];
}
