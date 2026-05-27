# Phase 04 — Dashboard

## Context Links

- [PRD §7.9 Progress Dashboard](../../PRD.md), [§10.5 Recommendations](../../PRD.md), [§6.2 Returning User Journey](../../PRD.md)
- [System Architecture §6 Data Model](../../docs/system-architecture.md#6-data-model-prisma)

## Overview

- **Priority:** P1
- **Status:** pending
- Build the progress dashboard: overview cards, score trend, topic radar, weak areas, AI-recommended next sessions.

## Key Insights

- All aggregations queryable from `AnswerFeedback` + `InterviewSession` — no need for a separate `UserProgress` table at MVP scale.
- Recommendations don't need a new AI call per dashboard load. Compute on session complete; cache `recommendedTopics` in `SessionSummary`. Surface the most recent.
- Recharts handles radar + line; keep all chart configs in one `chart-config.ts` for consistent theming.
- RSC for cards + queries; client components only for interactive chart tooltips.

## Requirements

**Functional**
- Overview cards: total sessions, total questions, avg score, best/weakest topic, current streak (PRD §7.9).
- Score trend line — last 30 days.
- Topic radar — score per topic across all sessions.
- Weak area list — bottom 3 dimensions globally.
- Recommended next practice — from latest `SessionSummary.recommendedTopics`.
- Empty state for users with 0 sessions (PRD §19 edge case).

**Non-functional**
- Dashboard load < 2s (PRD §11.1).
- Single SQL query per aggregate where possible.

## Architecture

- `ProgressService` is pure read — runs Prisma `groupBy` + raw SQL for streak.
- Dashboard page is RSC; loads all data in parallel via `Promise.all`.
- Charts client-side; receive serialized data as props.
- Recommendation engine = MVP rule: pull `recommendedTopics` from most recent completed `SessionSummary`. Fallback: bottom 3 topics by avg score.

## Related Code Files

**Create**
- `src/features/dashboard/server/progress-service.ts` — all aggregations
- `src/features/dashboard/server/recommendation-service.ts`
- `src/features/dashboard/components/overview-cards.tsx`
- `src/features/dashboard/components/score-trend-chart.tsx`
- `src/features/dashboard/components/topic-radar-chart.tsx`
- `src/features/dashboard/components/weak-areas-list.tsx`
- `src/features/dashboard/components/recommended-practice.tsx`
- `src/features/dashboard/components/empty-state.tsx`
- `src/features/dashboard/components/streak-badge.tsx`
- `src/features/dashboard/chart-config.ts` — colors, axis formatters
- `src/app/(app)/dashboard/page.tsx`
- `src/app/api/dashboard/route.ts` — optional, if client wants live refresh

**Modify**
- `src/features/feedback/server/summary-service.ts` — ensure `recommendedTopics` always set
- `src/app/(app)/layout.tsx` — add sidebar nav linking dashboard, practice, history

**Delete** — n/a

## Implementation Steps

1. Install `recharts`.
2. Implement `ProgressService`:
   - `getOverview(userId)` — counts + avg via Prisma aggregate.
   - `getScoreTrend(userId, days=30)` — group by day, return `{date, avgScore}[]`.
   - `getTopicBreakdown(userId)` — group answers by question.topic, avg overallScore.
   - `getDimensionWeakAreas(userId)` — avg per dimension across all feedback, return bottom 3.
   - `getStreak(userId)` — consecutive days with ≥1 completed session (raw SQL with generate_series).
3. Implement `RecommendationService.getRecommendations(userId)` — pull latest summary, fall back to weak topics.
4. Build chart-config with brand colors + scale formatters (`0-5`, date `MMM dd`).
5. Build `OverviewCards` — 6 cards in 3-col grid (responsive to 2-col, then 1-col).
6. Build `ScoreTrendChart` — Recharts `LineChart` with dotted grid, tooltip on hover.
7. Build `TopicRadarChart` — `RadarChart` with one axis per topic, score 0-5.
8. Build `WeakAreasList` — 3 chips showing dimension name + avg score + improvement hint.
9. Build `RecommendedPractice` — 3 cards each starting a pre-configured session.
10. Build `EmptyState` — friendly CTA to start first practice when no sessions exist.
11. Dashboard page composes everything; uses `Promise.all` for parallel fetches.
12. Add sidebar nav (Dashboard | Practice | History | Settings).
13. Verify responsive: 3-col → 2-col @ md → 1-col @ sm.
14. Verify empty state path with a fresh test user.
15. `pnpm tsc --noEmit` clean.

## Todo List

- [ ] Recharts installed
- [ ] ProgressService implements all 5 aggregations
- [ ] Streak query handles timezone (Asia/Saigon for current user, generally UTC)
- [ ] RecommendationService falls back to weak topics if no summary
- [ ] Overview cards render with real data
- [ ] Score trend chart renders for 1, 7, 30, 90 day windows
- [ ] Topic radar chart renders for users with 1+ topic completed
- [ ] Weak areas list shows bottom 3 dimensions
- [ ] Recommended practice cards link to pre-configured session creation
- [ ] Empty state shows for zero-session users
- [ ] Sidebar nav present on all (app) routes
- [ ] Dashboard responsive on mobile

## Success Criteria

- A user with 5+ sessions sees populated charts.
- A brand-new user sees empty state with clear next action.
- Clicking "Recommended Practice" card starts a session with pre-selected topics + difficulty.
- Dashboard renders in <2s with 100 sessions seeded.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Aggregation queries slow at scale | Add `(userId, completedAt)` index; consider materialized view post-MVP |
| Recharts bundle size hurts LCP | Lazy-load via `dynamic(() => import(...), { ssr: false })` on dashboard page only |
| Streak query timezone bugs | Store `completedAt` in UTC; compute streak in user's locale (read from `Intl`) |
| Empty/sparse data breaks chart layout | Chart components handle 0/1 data points gracefully; show "more data needed" hint |

## Security Considerations

- All aggregation queries filter by `userId` — no cross-tenant leaks.
- No raw SQL with user input; Prisma parameterized queries only (or strict template tagging).

## Next Steps

Phase 05 — polish, performance, deploy. Add analytics events, error boundaries, rate limit tuning.
