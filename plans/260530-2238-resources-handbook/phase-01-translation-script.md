---
phase: 1
title: "Translation Script"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Translation Script

## Overview

Write a one-time Node.js/TypeScript script that parses `resources/fe-review-handbook.html`
with cheerio, extracts all Vietnamese text and structured content (quizzes, flashcards,
diagrams, callouts), translates text via the existing `translateToEnglish()` helper, and
writes the result to `src/data/resources/frontend-system-design.json`.

The translation cache (`scripts/.translation-cache.json`) will be reused — no redundant
LLM calls for strings already cached from the seed extraction pipeline.

## Requirements

- Functional:
  - Parse 38 `<section class="topic">` blocks; each becomes one `HandbookSection`
  - Extract from each section: `id`, `number` label, `h2` title, `p.topic-intro`, `h3` subheadings, body HTML blocks
  - Extract 51 `.quiz` blocks → `QuizItem[]` (question, options[], answer index, explanation)
  - Extract 39 `.flashcard` blocks → `FlashcardItem[]` (front, back)
  - Extract `.callout` blocks (tip / warn / key / interview) → `CalloutItem[]`
  - Extract `.diagram svg` blocks as raw SVG strings (no translation needed)
  - Sidebar nav extracted from `nav a` elements → `NavItem[]` (href, label)
  - Translate: all Vietnamese text strings (headings, paragraphs, quiz text, flashcard text, callouts)
  - Do NOT translate: SVG content, code blocks (`<pre>`, `<code>`), CSS class values
- Non-functional:
  - Uses existing `translateToEnglish()` from `scripts/extract-seed-llm-helpers.ts`
  - Script is idempotent — safe to re-run; translation cache persists across runs
  - Output JSON committed to repo (static data, no runtime cost)

## Architecture

```
resources/fe-review-handbook.html
  ↓ (cheerio parse)
scripts/extract-resource-handbook.ts
  ↓ (translateToEnglish per string)
scripts/.translation-cache.json  (shared with seed pipeline)
  ↓ (write)
src/data/resources/frontend-system-design.json
```

### Output JSON shape (top-level)

```ts
{
  meta: {
    title: string;              // "Frontend System Design: A to Z"
    description: string;        // translated hero paragraph
    stats: { label: string; value: string }[];
  };
  nav: { id: string; label: string; group?: string }[];
  sections: HandbookSection[];
}
```

Each `HandbookSection`:
```ts
{
  id: string;           // e.g. "intro"
  num: string;          // e.g. "01 — FOUNDATION"
  title: string;        // translated h2
  intro: string;        // translated topic-intro paragraph
  blocks: ContentBlock[]; // ordered content items
}
```

`ContentBlock` union:
```ts
| { type: 'h3'; text: string }
| { type: 'h4'; text: string }
| { type: 'p'; html: string }         // translated HTML fragment
| { type: 'ul'; items: string[] }
| { type: 'ol'; items: string[] }
| { type: 'callout'; variant: 'tip'|'warn'|'key'|'interview'; title: string; body: string }
| { type: 'diagram'; svg: string; caption?: string }
| { type: 'table'; headers: string[]; rows: string[][] }
| { type: 'quiz'; question: string; options: string[]; answer: number; explanation: string }
| { type: 'flashcards'; items: { front: string; back: string }[] }
| { type: 'pills'; items: { text: string; variant: 'good'|'bad'|'neutral' }[] }
| { type: 'cards'; items: { icon: string; title: string; body: string }[] }
```

## Related Code Files

- Create: `scripts/extract-resource-handbook.ts`
- Read: `scripts/extract-seed-llm-helpers.ts` (reuse `translateToEnglish`)
- Create: `src/data/resources/frontend-system-design.json` (output)
- Create: `src/data/resources/` directory

## Implementation Steps

1. **Create `scripts/extract-resource-handbook.ts`**

   ```ts
   import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
   import * as cheerio from 'cheerio';
   import { translateToEnglish } from './extract-seed-llm-helpers';

   const SRC = 'resources/fe-review-handbook.html';
   const OUT = 'src/data/resources/frontend-system-design.json';
   ```

2. **Parse nav** — `nav a` elements → `{ id, label }` array. Translate label text.

3. **Parse hero** — `.hero h1`, `.hero p`, `.hero-stats` → `meta` object. Translate all text.

4. **Parse sections loop** — `$('section.topic')` forEach:
   - Read `id`, `data-num` or `.topic-num` text, `h2` text, `.topic-intro` text
   - Walk child nodes in document order, classify each into a `ContentBlock`

5. **Content block classifier** (per child element):
   - `h3` → `{ type: 'h3', text: await translateToEnglish(text) }`
   - `.callout` → extract `.callout-title` and `p` text; detect variant from class
   - `.diagram` → extract `svg` outerHTML as-is; translate `.diagram-cap` text
   - `.quiz` → extract `.quiz-q`, `.quiz-opt` texts, find correct option (`.correct` class or `data-correct`), `.quiz-explain` text
   - `.flashcards` → extract each `.fc-front`/`.fc-back`
   - `table` → extract `th[]` headers, `td[][]` rows
   - `.pills` → extract `.pill` texts + classes
   - `.cards` → extract `.card-ico`, `h4`, `p` per card
   - `p`, `ul`, `ol` → translate; preserve `<code>` and `<pre>` untranslated

6. **Translation helper for HTML fragments** — strip tags for translation input, re-inject
   translated text around preserved `<code>`/`<pre>` islands. Pattern:
   ```ts
   async function translateHtml(html: string): Promise<string> {
     // Replace <code>...</code> with placeholders, translate, restore
   }
   ```

7. **Write JSON** — `writeFileSync(OUT, JSON.stringify(data, null, 2))`. Also `mkdirSync` for the dir.

8. **Add script to `package.json`**:
   ```json
   "extract-handbook": "tsx scripts/extract-resource-handbook.ts"
   ```

9. **Run**: `PATH=... pnpm extract-handbook`

## Success Criteria

- [ ] `pnpm extract-handbook` runs without errors
- [ ] `src/data/resources/frontend-system-design.json` created and committed
- [ ] JSON contains exactly 38 sections
- [ ] All `h2`/`h3`/intro text is in English (spot-check 5 sections)
- [ ] Quiz `answer` index matches actual correct option
- [ ] SVG content preserved verbatim (not translated)
- [ ] `<code>` / `<pre>` blocks not translated

## Risk Assessment

- **Quiz answer detection**: The HTML quiz correct option may be determined by a JS runtime `data-correct` attribute or by order. Inspect actual HTML structure before coding. Fallback: hardcode answer=0 and flag for manual review.
- **HTML fragment translation quality**: `translateToEnglish()` works on plain text. HTML fragments with inline `<strong>`, `<em>`, `<code>` mixed in may produce mangled output. Solution: strip to plaintext, translate, reapply formatting where unambiguous. If complex, store raw HTML and translate at display time (but this means runtime calls — avoid).
- **Translation cache miss rate**: 38 sections × avg 20 strings = ~760 translation calls. Most are new (not in seed cache). Budget ~15 min runtime on first run. Subsequent runs: instant.
