---
phase: 6
title: "Navigation + Dashboard Integration"
status: completed
priority: P2
effort: "2h"
dependencies: [3, 4]
---

# Phase 6: Navigation + Dashboard Integration

## Overview

Wire coding challenges into the app's navigation and surface a summary stat on the dashboard. No new data models — reuses `CodingSubmission` data already persisted in earlier phases.

## Architecture

### Navigation

Add "Coding Challenges" link to the sidebar nav (same pattern as "Question Bank", "Study Plan").

```
src/app/(app)/layout.tsx  (or wherever the sidebar nav items are defined)
  → add { href: '/coding-challenges', label: 'Coding Challenges', icon: Code2 }
```

Identify the nav config location first — it may be a separate `nav-items.ts` config or inline in the layout.

### Dashboard widget

Small stat card added to the dashboard showing:
- Challenges solved / total (e.g. "7 / 15 solved")
- Link to `/coding-challenges`

Placed below or beside existing stat cards — no layout restructuring.

### Dashboard API

`GET /api/dashboard` already aggregates stats. Two options:
1. **Add to existing dashboard route** — append `codingStats` to the response object (preferred — one round-trip)
2. **Separate fetch** — only if dashboard route is too complex to extend

Prefer option 1. Add to the dashboard query:
```ts
const codingStats = await prisma.codingSubmission.groupBy({
  by: ['challengeId'],
  where: { userId, status: 'passed' },
  _count: { challengeId: true },
});
const solvedCount = codingStats.length;
const totalCount = await prisma.codingChallenge.count();
```

## Related Code Files

- Modify: nav items config (identify exact file in implementation)
- Modify: `src/app/api/dashboard/route.ts` — add `codingStats` field
- Modify: `src/features/dashboard/` — add coding challenges stat card component
- Modify: dashboard page to render new stat card

## Implementation Steps

### 1. Locate and update nav

Search for existing nav items (e.g. `grep -r "question-bank" src/app/(app)/layout.tsx`). Add entry:
```ts
{ href: '/coding-challenges', label: 'Coding Challenges', icon: Code2 }
```
`Code2` is from `lucide-react` (already a dependency).

### 2. Dashboard API extension

In `src/app/api/dashboard/route.ts`, add the two Prisma queries above and include `codingStats: { solved: solvedCount, total: totalCount }` in the JSON response.

Update the dashboard response type/Zod schema if one exists.

### 3. Dashboard stat card

Create `src/features/dashboard/coding-challenges-stat-card.tsx`:
```tsx
// Props: solved: number, total: number
// Renders: "Coding Challenges" label, "X / Y solved" value, link to /coding-challenges
// Style: matches existing stat cards (same Card component, same spacing)
```

Add to dashboard page component after existing stat cards.

### 4. Active nav highlight

The existing layout likely uses `usePathname()` to highlight the active nav item — the new entry should work automatically if it follows the same pattern.

## Success Criteria

- [ ] "Coding Challenges" appears in sidebar nav with correct icon
- [ ] Active state highlights when on `/coding-challenges` routes
- [ ] Dashboard shows "X / Y solved" stat card linked to `/coding-challenges`
- [ ] Stat count is accurate (updates after solving a challenge)
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Dashboard query performance**: Two extra Prisma queries on an already-aggregate route. Both are indexed (`userId` index on `CodingSubmission`, full count on `CodingChallenge` is cheap at 15 rows). Negligible impact.
- **Nav file location**: Must scout the actual nav config before editing — don't assume the file path.
