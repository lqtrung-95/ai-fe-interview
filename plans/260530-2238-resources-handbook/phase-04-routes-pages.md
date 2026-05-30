---
phase: 4
title: "Routes & Pages"
status: pending
priority: P1
effort: "2h"
dependencies: [3]
---

# Phase 4: Routes & Pages

## Overview

Wire up the routes, import the static JSON, and assemble the pages using components from
Phase 3. Add "Resources" to the app sidebar nav. Two pages total: an index listing and
the handbook detail page.

## Requirements

- Functional:
  - `GET /resources` — grid of available guides (just one card for now: FE System Design)
  - `GET /resources/frontend-system-design` — full handbook page with sidebar + content
  - Sidebar nav updated with "Resources" entry (Library icon)
  - Active link highlighting works for `/resources` and `/resources/frontend-system-design`
  - Page `<title>` and `<meta description>` set via `generateMetadata`
  - Handbook page has a sticky sidebar (desktop) + mobile top nav (collapsible)
- Non-functional:
  - Pages are Server Components — JSON imported at build time (no DB query, no fetch)
  - No loading skeletons needed (static data; instant)
  - Handbook page scrolls to correct section on anchor link click (`scroll-margin-top`)

## Architecture

```
src/app/(app)/resources/
  page.tsx                         — /resources index (Server Component)
  frontend-system-design/
    page.tsx                       — handbook detail (Server Component)
    loading.tsx                    — minimal spinner (reuse pattern from other routes)

src/features/app/app-sidebar.tsx   — add Resources nav entry
```

### Layout of handbook page

```
┌─────────────┬────────────────────────────────┐
│  AppSidebar │  Handbook Page                 │
│  (existing) │  ┌──────────┬────────────────┐ │
│             │  │ Handbook │  Section        │ │
│             │  │ Sidebar  │  Content        │ │
│             │  │ (sticky) │  (scrollable)   │ │
│             │  └──────────┴────────────────┘ │
└─────────────┴────────────────────────────────┘
```

The handbook page uses a **two-column layout inside the main content area** — separate
from the app's outer `AppSidebar`. On mobile the handbook sidebar collapses to a
dropdown/drawer triggered by a "Contents" button in the page header.

## Related Code Files

- Create: `src/app/(app)/resources/page.tsx`
- Create: `src/app/(app)/resources/frontend-system-design/page.tsx`
- Create: `src/app/(app)/resources/frontend-system-design/loading.tsx`
- Modify: `src/features/app/app-sidebar.tsx` — add Resources nav item
- Read: `src/data/resources/frontend-system-design.json` (imported in page)
- Read: `src/data/resources/handbook-types.ts`

## Implementation Steps

### 1. Update `app-sidebar.tsx` — add Resources link

```tsx
import { BookOpen, Clock, Database, LayoutDashboard, Library, Settings, Zap } from 'lucide-react';

const NAV = [
  { href: '/dashboard',                  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/practice/new',               label: 'Practice',     icon: Zap },
  { href: '/study-plan',                 label: 'Study Plan',   icon: BookOpen },
  { href: '/question-bank',              label: 'Question Bank',icon: Database },
  { href: '/resources',                  label: 'Resources',    icon: Library },  // NEW
  { href: '/history',                    label: 'History',      icon: Clock },
  { href: '/settings',                   label: 'Settings',     icon: Settings },
];
```

Active check for `/resources` must also match `/resources/frontend-system-design`:
```tsx
const active =
  pathname === item.href ||
  (item.href !== '/dashboard' && pathname.startsWith(item.href));
// Already works — no change needed to active logic
```

### 2. Resources index page (`/resources/page.tsx`)

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Library, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'In-depth guides and handbooks for frontend interview preparation.',
};

const GUIDES = [
  {
    href: '/resources/frontend-system-design',
    title: 'Frontend System Design',
    description: 'RADIO framework, rendering patterns, performance, and 6 real-world case studies.',
    sections: 38,
    quizzes: 51,
    tags: ['Architecture', 'Performance', 'Case Studies'],
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Library className="h-3.5 w-3.5" />
          Resources
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Study Guides</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Deep-dive handbooks to build lasting understanding — not just interview answers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link key={g.href} href={g.href}
            className="group rounded-xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:bg-primary/4 transition-colors space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold">{g.title}</h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{g.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.tags.map(t => (
                <span key={t} className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground font-mono">
              <span>{g.sections} sections</span>
              <span>{g.quizzes} quizzes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### 3. Handbook detail page (`/resources/frontend-system-design/page.tsx`)

```tsx
import type { Metadata } from 'next';
import handbookData from '@/data/resources/frontend-system-design.json';
import type { HandbookData } from '@/data/resources/handbook-types';
import { HandbookSidebar } from '@/features/resources/components/handbook-sidebar';
import { HandbookContentRenderer } from '@/features/resources/components/handbook-content-renderer';

const data = handbookData as HandbookData;

export const metadata: Metadata = {
  title: data.meta.title,
  description: data.meta.description,
};

export default function FrontendSystemDesignPage() {
  return (
    <div className="flex min-h-screen">
      {/* Handbook sidebar — sticky, hidden on mobile */}
      <HandbookSidebar nav={data.nav} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Hero */}
        <header className="border-b border-border/60 px-8 py-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Frontend System Design
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{data.meta.title}</h1>
          <p className="text-muted-foreground max-w-2xl">{data.meta.description}</p>
          {/* Stats */}
          <div className="flex gap-8 pt-2">
            {data.meta.stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Sections */}
        <div className="px-8 pb-24 space-y-0">
          {data.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="py-14 border-b border-border/40 scroll-mt-8 space-y-4"
            >
              <div>
                <span className="text-xs font-mono text-primary uppercase tracking-widest">
                  {section.num}
                </span>
                <h2 className="text-2xl font-bold tracking-tight mt-2">{section.title}</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  {section.intro}
                </p>
              </div>
              <HandbookContentRenderer blocks={section.blocks} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. Loading skeleton (`loading.tsx`)

```tsx
export default function Loading() {
  return (
    <div className="flex min-h-screen animate-pulse">
      <div className="w-64 shrink-0 border-r border-border/40 bg-muted/20" />
      <div className="flex-1 px-8 py-10 space-y-6">
        <div className="h-4 w-32 rounded bg-muted/40" />
        <div className="h-8 w-96 rounded bg-muted/40" />
        <div className="h-4 w-64 rounded bg-muted/30" />
      </div>
    </div>
  );
}
```

### 5. Enable JSON import in TypeScript

Add `"resolveJsonModule": true` to `tsconfig.json` if not already present (check first):
```bash
grep resolveJsonModule tsconfig.json
```

## Success Criteria

- [ ] `GET /resources` renders index with one guide card, no errors
- [ ] `GET /resources/frontend-system-design` renders all 38 sections
- [ ] Sidebar "Resources" link appears between Question Bank and History
- [ ] Clicking a sidebar nav link in the handbook scrolls to correct section
- [ ] `generateMetadata` sets correct page title
- [ ] Mobile viewport: handbook sidebar hidden, content readable at 375px
- [ ] `pnpm build` passes

## Risk Assessment

- **JSON import size**: `frontend-system-design.json` may be 500KB–1MB with all SVG content inline. At build time this is fine (static). Runtime: only loaded on `/resources/frontend-system-design` route. If too large, consider splitting SVG strings into a separate file and lazy-loading them.
- **`resolveJsonModule`**: Next.js 16 with Turbopack may handle JSON imports differently. If static import fails, fallback: `readFileSync` in a Server Component using `import 'server-only'`.
- **Two sidebars on desktop**: The outer AppSidebar (56px wide) + inner HandbookSidebar creates a three-column layout on narrow laptops. Set HandbookSidebar `width: 240px` and ensure it hides below `lg:` breakpoint to avoid squeezing the content column.
