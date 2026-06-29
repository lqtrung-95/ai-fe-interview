# Phase 05 — Dashboard Card & Verification

**Priority:** P1. **Status:** Not started. **Depends on:** Phases 02–04.

## Overview
Surface the loop on the dashboard so users see what's due and their streak the
moment they log in. Then verify the whole feature (typecheck, lint, tests).

## Architecture
- A "Daily review" card sits beside the existing Readiness Score card. Shows:
  - **Due count** (`getReviewStats.dueCount`) with a "Start review →" link to `/review`.
  - **Streak** (🔥 `currentStreak`-day, with `longestStreak` subtle).
  - **Goal ring** (`reviewedToday / dailyGoal`).
- Server-rendered via existing dashboard data flow; reuse the card styling already
  used by `readiness-score-card.tsx` for visual consistency.

## Related code files
- Create: `src/features/dashboard/components/daily-review-card.tsx`.
- Modify: dashboard page/`overview-cards.tsx` — render the new card in the grid.
- Modify: `src/features/dashboard/server/progress-service.ts` (or new
  `review-service.ts`) — expose `getReviewStats` + `getStreak` to the dashboard.
- Reuse: `readiness-score-card.tsx` (style reference), `DashboardPrefetcher` if applicable.

## Implementation steps
1. Dashboard accessor returns `{ dueCount, reviewedToday, dailyGoal, currentStreak, longestStreak }`.
2. `daily-review-card.tsx` — due count + CTA, streak flame, goal ring (CSS conic
   gradient or reuse an existing ring component if present).
3. Slot the card into the dashboard grid next to Readiness Score.
4. Nav "Review" badge (optional): show due count via the same accessor.

## Verification (closes Phase A)
- `pnpm tsc --noEmit` — clean.
- `pnpm eslint <changed files>` — no new errors (note: pre-existing
  `react-hooks/refs` warnings in interview-main-panel are unrelated).
- Unit tests pass: `applySm2`, `streak-utils`.
- Manual smoke (dev server + Chrome MCP): complete a practice answer → ReviewItem
  upserted; `/review` shows due topic → start → lands in practice; dashboard card
  shows due count + streak.

## Todo
- [ ] dashboard accessor (`getReviewStats` + `getStreak`)
- [ ] `daily-review-card.tsx`
- [ ] card slotted into dashboard grid
- [ ] (optional) nav due-count badge
- [ ] typecheck + lint + unit tests green
- [ ] manual smoke pass
- [ ] update `docs/system-architecture.md` (new Review feature module)

## Success criteria
- Dashboard shows accurate due count + streak + goal; "Start review" works
  end-to-end; all checks green.

## Risks
- Card empty state (new user, 0 due, 0 streak) must read as inviting, not broken.

## Next
- Phase A-2 (later): email/cron "you have N reviews due" nudge.
- Phase B (later): conversational voice mock.
