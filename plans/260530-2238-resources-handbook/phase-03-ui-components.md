---
phase: 3
title: "UI Components"
status: pending
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: UI Components

## Overview

Build the feature-level React components that render handbook content. All live under
`src/features/resources/components/`. Existing `QuizCard` and `StudyDiagram` are reused
or extended — no duplication.

## Requirements

- Functional:
  - `HandbookSidebar` — sticky left nav with section links and scroll-based active highlight
  - `HandbookContentRenderer` — maps `ContentBlock[]` to JSX (server component)
  - `HandbookQuizBlock` — wraps existing `QuizCard`; renders inline quiz from JSON data
  - `HandbookFlashcardDeck` — flip-card grid (client component, CSS 3D flip)
  - `HandbookCallout` — tip/warn/key/interview callout blocks
  - `HandbookTableBlock` — responsive table from `headers[]` + `rows[][]`
  - `HandbookDiagram` — thin wrapper over existing `StudyDiagram` (SVG via dangerouslySetInnerHTML)
- Non-functional:
  - Sidebar is a `'use client'` component (IntersectionObserver for active link)
  - All other components are Server Components unless interactivity required
  - Flashcard flip uses CSS transforms only — no JS animation library
  - Components respect dark mode via existing CSS variables

## Architecture

```
src/features/resources/
  components/
    handbook-sidebar.tsx          'use client' — sticky nav + scroll spy
    handbook-content-renderer.tsx  Server — maps ContentBlock[] → JSX
    handbook-quiz-block.tsx        re-exports QuizCard with local data prop
    handbook-flashcard-deck.tsx   'use client' — flip card grid
    handbook-callout.tsx           Server — tip/warn/key/interview
    handbook-table-block.tsx       Server — responsive table
    handbook-diagram.tsx           Server — thin wrapper over StudyDiagram
  index.ts                         barrel export
```

## Related Code Files

- Create: `src/features/resources/components/handbook-sidebar.tsx`
- Create: `src/features/resources/components/handbook-content-renderer.tsx`
- Create: `src/features/resources/components/handbook-quiz-block.tsx`
- Create: `src/features/resources/components/handbook-flashcard-deck.tsx`
- Create: `src/features/resources/components/handbook-callout.tsx`
- Create: `src/features/resources/components/handbook-table-block.tsx`
- Create: `src/features/resources/components/handbook-diagram.tsx`
- Create: `src/features/resources/index.ts`
- Read: `src/features/study/components/quiz-card.tsx` (reuse QuizData + QuizCard)
- Read: `src/features/study/components/study-diagram.tsx` (reuse SVG pattern)

## Implementation Steps

### 1. `handbook-sidebar.tsx`

```tsx
'use client';
// Props: nav: NavItem[], activeId: string (starts as first section)
// Scroll spy: IntersectionObserver on section[id] elements
// Renders sticky aside (hidden on mobile, visible md+)
// Active link: bg-primary/15 text-primary + left border bar (same as AppSidebar pattern)
// Reads NavItem.group to render group headings
```

Key implementation:
```tsx
useEffect(() => {
  const obs = new IntersectionObserver(
    (entries) => {
      const visible = entries.find(e => e.isIntersecting);
      if (visible) setActiveId(visible.target.id);
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
  return () => obs.disconnect();
}, []);
```

### 2. `handbook-content-renderer.tsx`

```tsx
// Server component — no 'use client'
// Props: blocks: ContentBlock[]
// Maps each block type to its component:
export function HandbookContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h3':       return <h3 key={i} className="text-lg font-semibold mt-8 mb-3">{block.text}</h3>;
          case 'h4':       return <h4 key={i} className="text-base font-semibold mt-5 mb-2 text-foreground">{block.text}</h4>;
          case 'p':        return <p key={i} className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: block.html }} />;
          case 'ul':       return <ul key={i} className="space-y-1.5 my-3">{block.items.map((item,j)=><li key={j} className="flex gap-2 text-sm text-muted-foreground"><span className="text-primary mt-0.5">→</span>{item}</li>)}</ul>;
          case 'ol':       return <ol key={i} className="list-decimal list-inside space-y-1.5 my-3 text-sm text-muted-foreground">{block.items.map((item,j)=><li key={j}>{item}</li>)}</ol>;
          case 'pre':      return <pre key={i} className="rounded-lg bg-muted/50 border border-border/60 p-4 overflow-x-auto text-xs font-mono leading-relaxed">{block.label && <span className="...">{block.label}</span>}{block.code}</pre>;
          case 'callout':  return <HandbookCallout key={i} {...block} />;
          case 'diagram':  return <HandbookDiagram key={i} svg={block.svg} caption={block.caption} />;
          case 'table':    return <HandbookTableBlock key={i} headers={block.headers} rows={block.rows} />;
          case 'quiz':     return <HandbookQuizBlock key={i} data={block} />;
          case 'flashcards': return <HandbookFlashcardDeck key={i} items={block.items} />;
          case 'pills':    return <div key={i} className="flex flex-wrap gap-2 my-3">{block.items.map((p,j)=><span key={j} className={cn('rounded-md px-2.5 py-1 text-xs font-mono border', p.variant==='good'&&'text-green-600 border-green-500/30 bg-green-500/8', p.variant==='bad'&&'text-red-600 border-red-500/30 bg-red-500/8', p.variant==='neutral'&&'text-muted-foreground border-border/60 bg-muted/40')}>{p.text}</span>)}</div>;
          case 'cards':    return <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">{block.items.map((c,j)=><div key={j} className="rounded-xl border border-border/60 bg-card p-4"><div className="text-2xl mb-2">{c.icon}</div><h4 className="text-sm font-semibold mb-1">{c.title}</h4><p className="text-xs text-muted-foreground">{c.body}</p></div>)}</div>;
          default:         return null;
        }
      })}
    </div>
  );
}
```

### 3. `handbook-quiz-block.tsx`

```tsx
// Bridges ContentBlock quiz shape → QuizCard's QuizData shape
import { QuizCard } from '@/features/study/components/quiz-card';
export function HandbookQuizBlock({ data }: { data: QuizBlock }) {
  return (
    <div className="my-6">
      <QuizCard quiz={{ format: 'mcq', ...data }} />
    </div>
  );
}
```

### 4. `handbook-flashcard-deck.tsx`

```tsx
'use client';
// CSS 3D flip — no JS animation lib needed
// Each card: front (term/question) / back (definition/answer)
// Click toggles flipped state per card independently
// Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

// CSS in component via Tailwind + inline style for 3D:
// .card { perspective: 1000px }
// .inner { transition: transform 0.4s; transform-style: preserve-3d }
// .inner.flipped { transform: rotateY(180deg) }
// .front, .back { backface-visibility: hidden }
// .back { transform: rotateY(180deg) }
```

### 5. `handbook-callout.tsx`

```tsx
// variant → icon + border color + title color
const CALLOUT_STYLES = {
  tip:       { icon: '💡', border: 'border-l-green-500',  titleCls: 'text-green-600 dark:text-green-400' },
  warn:      { icon: '⚠️', border: 'border-l-amber-500',  titleCls: 'text-amber-600 dark:text-amber-400' },
  key:       { icon: '🎯', border: 'border-l-primary',    titleCls: 'text-primary' },
  interview: { icon: '🎤', border: 'border-l-border',     titleCls: 'text-foreground' },
};
```

### 6. `handbook-table-block.tsx`

```tsx
// Wrap in overflow-x-auto div for mobile
// thead: bg-muted/40 text-xs uppercase tracking-wider
// tbody: divide-y divide-border/50, hover:bg-muted/20
```

### 7. `handbook-diagram.tsx`

```tsx
// Thin wrapper — delegates to StudyDiagram pattern
// dangerouslySetInnerHTML={{ __html: svg }} inside styled container
// caption below in muted mono text
```

## Success Criteria

- [ ] All 7 component files created
- [ ] `HandbookContentRenderer` renders all 12 `ContentBlock` types without TypeScript errors
- [ ] `HandbookFlashcardDeck` flip works on click (no layout shift)
- [ ] `HandbookSidebar` highlights correct section on scroll
- [ ] `HandbookCallout` renders all 4 variants with correct colors
- [ ] `pnpm tsc --noEmit` passes after this phase

## Risk Assessment

- **Flashcard 3D flip on mobile**: `perspective` + `backface-visibility` have Safari quirks. Test on iOS Safari. Fallback: simple opacity/height toggle instead of 3D flip.
- **`dangerouslySetInnerHTML` for `p` blocks**: HTML from translation may include `<strong>`, `<em>`, `<code>` — safe since we control the source. No user input involved.
- **SVG sizing**: SVGs from the handbook have fixed width/height attributes. Override with `width: 100%; height: auto` in the diagram wrapper to ensure responsive behavior.
