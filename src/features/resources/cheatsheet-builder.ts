/**
 * Derives a condensed "cheatsheet" view from a full handbook.
 * No new content — extracts the highest-signal blocks from each section:
 *   - key takeaways  (callouts: key, interview, warn variants)
 *   - decision tables
 *   - flashcards (Q→A recall pairs)
 *
 * The cheatsheet auto-stays in sync with the handbook since it's purely derived.
 */

import type { CalloutVariant, HandbookData } from '@/data/resources/handbook-types';

export interface CheatsheetTakeaway {
  variant: CalloutVariant;
  title: string;
  body: string;
}

export interface CheatsheetTable {
  headers: string[];
  rows: string[][];
}

export interface CheatsheetSection {
  id: string;
  num: string;
  title: string;
  takeaways: CheatsheetTakeaway[];
  tables: CheatsheetTable[];
  flashcards: { front: string; back: string }[];
}

export interface CheatsheetData {
  title: string;
  description: string;
  sections: CheatsheetSection[];
}

// Callout variants worth keeping for a cheatsheet (skip verbose "tip").
const KEEP_VARIANTS: CalloutVariant[] = ['key', 'interview', 'warn'];

export function buildCheatsheet(data: HandbookData): CheatsheetData {
  const sections: CheatsheetSection[] = data.sections.map((section) => {
    const takeaways: CheatsheetTakeaway[] = [];
    const tables: CheatsheetTable[] = [];
    const flashcards: { front: string; back: string }[] = [];

    for (const block of section.blocks) {
      if (block.type === 'callout' && KEEP_VARIANTS.includes(block.variant)) {
        takeaways.push({ variant: block.variant, title: block.title, body: block.body });
      } else if (block.type === 'table') {
        tables.push({ headers: block.headers, rows: block.rows });
      } else if (block.type === 'flashcards') {
        flashcards.push(...block.items);
      }
    }

    return { id: section.id, num: section.num, title: section.title, takeaways, tables, flashcards };
  })
  // Drop sections that have no condensable content
  .filter((s) => s.takeaways.length > 0 || s.tables.length > 0 || s.flashcards.length > 0);

  return {
    title: data.meta.title,
    description: data.meta.description,
    sections,
  };
}
