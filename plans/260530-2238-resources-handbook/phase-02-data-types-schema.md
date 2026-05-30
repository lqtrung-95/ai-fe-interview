---
phase: 2
title: "Data Types & Schema"
status: pending
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: Data Types & Schema

## Overview

Define the TypeScript types that describe the JSON produced by Phase 1 and consumed by
the React components in Phase 3. Lives in `src/data/resources/handbook-types.ts` — a
pure type file with no runtime dependencies.

## Requirements

- Functional:
  - All `ContentBlock` variants typed with discriminated unions
  - `HandbookSection`, `HandbookMeta`, `NavItem` types exported
  - Types match exactly what the extraction script writes and what page components read
- Non-functional:
  - No Zod schemas — static JSON is pre-validated at extraction time; runtime validation
    adds bundle weight for no benefit
  - File stays under 100 lines

## Architecture

Single file `src/data/resources/handbook-types.ts` imported by:
- `scripts/extract-resource-handbook.ts` (extraction output)
- `src/features/resources/` components (rendering input)
- `src/app/(app)/resources/frontend-system-design/page.tsx`

## Related Code Files

- Create: `src/data/resources/handbook-types.ts`
- Read (for consistency): `scripts/extract-seed-types.ts` (existing type patterns)

## Implementation Steps

1. **Create `src/data/resources/handbook-types.ts`**:

```ts
// Types for the Frontend System Design handbook.
// Mirror the shape written by scripts/extract-resource-handbook.ts.

export type CalloutVariant = 'tip' | 'warn' | 'key' | 'interview';
export type PillVariant    = 'good' | 'bad' | 'neutral';

export type ContentBlock =
  | { type: 'h3';        text: string }
  | { type: 'h4';        text: string }
  | { type: 'p';         html: string }
  | { type: 'ul';        items: string[] }
  | { type: 'ol';        items: string[] }
  | { type: 'pre';       code: string; label?: string }
  | { type: 'callout';   variant: CalloutVariant; title: string; body: string }
  | { type: 'diagram';   svg: string; caption?: string }
  | { type: 'table';     headers: string[]; rows: string[][] }
  | { type: 'quiz';      question: string; options: string[]; answer: number; explanation: string }
  | { type: 'flashcards'; items: { front: string; back: string }[] }
  | { type: 'pills';     items: { text: string; variant: PillVariant }[] }
  | { type: 'cards';     items: { icon: string; title: string; body: string }[] };

export interface HandbookSection {
  id:     string;   // HTML anchor, e.g. "intro"
  num:    string;   // e.g. "01 — FOUNDATION"
  title:  string;   // translated h2
  intro:  string;   // translated topic-intro paragraph
  blocks: ContentBlock[];
}

export interface NavItem {
  id:     string;   // matches section id
  label:  string;   // translated nav link text
  group?: string;   // e.g. "Foundation", "Core", "Case Studies"
}

export interface HandbookStat {
  value: string;
  label: string;
}

export interface HandbookMeta {
  title:       string;
  description: string;
  stats:       HandbookStat[];
}

export interface HandbookData {
  meta:     HandbookMeta;
  nav:      NavItem[];
  sections: HandbookSection[];
}
```

2. **Import in extraction script** — replace inline `interface` definitions with imports
   from `./src/data/resources/handbook-types` (adjust path for scripts dir).

## Success Criteria

- [ ] `src/data/resources/handbook-types.ts` created
- [ ] No TypeScript errors in types file (`pnpm tsc --noEmit`)
- [ ] Extraction script (`phase-01`) imports and satisfies these types
- [ ] All Phase 3 components can import from this file without circular deps
