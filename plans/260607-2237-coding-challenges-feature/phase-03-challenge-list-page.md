---
phase: 3
title: "Challenge List Page"
status: completed
priority: P2
effort: "2h"
dependencies: [2]
---

# Phase 3: Challenge List Page

## Overview

A browsable catalog of coding challenges at `/coding-challenges`, filterable by difficulty and topic. Shows each challenge's title, difficulty badge, topic tag, and the user's best submission status (solved / attempted / unsolved).

## Architecture

```
/coding-challenges
  └── page.tsx (server component — fetches challenges + user submission statuses)
      └── ChallengeListClient (client component — filter state)
          └── ChallengeCard[] — links to /coding-challenges/[id]
```

**Data fetching:**
- Challenges: `GET /api/coding-challenges` (public, no auth needed — cached)
- User submission status: server-side Prisma query aggregated per challenge (`SELECT challengeId, MAX(passedCount = totalCount) as solved FROM CodingSubmission WHERE userId = ... GROUP BY challengeId`)

**Filter state:** URL search params (`?difficulty=mid&topic=Async`) — enables sharing and back-nav. No client state needed beyond reading/writing search params.

## Related Code Files

- Create: `src/app/(app)/coding-challenges/page.tsx`
- Create: `src/app/(app)/coding-challenges/loading.tsx`
- Create: `src/features/coding-challenges/challenge-list-client.tsx`
- Create: `src/features/coding-challenges/challenge-card.tsx`
- Create: `src/features/coding-challenges/challenge-filters.tsx`
- Create: `src/features/coding-challenges/server/get-challenges-with-status.ts`

## Implementation Steps

### 1. Server data fetcher

`src/features/coding-challenges/server/get-challenges-with-status.ts`

```ts
// Returns ChallengePublic[] enriched with { userStatus: 'solved'|'attempted'|'unsolved' }
// Called from the page server component.
// Unauthenticated users get 'unsolved' for all.
```

Runs two queries in parallel:
- `prisma.codingChallenge.findMany({ select: { safe fields } })`
- `prisma.codingSubmission.groupBy({ by: ['challengeId'], where: { userId }, _max: { ... } })`

### 2. Page server component

`src/app/(app)/coding-challenges/page.tsx`

```tsx
export default async function CodingChallengesPage() {
  const user = await getCurrentUser(); // returns DbUser | null — no redirect
  const challenges = await getChallengesWithStatus(user?.id);
  return <ChallengeListClient challenges={challenges} />;
}
```

Uses `getCurrentUser()` from `src/lib/auth/session.ts` (returns `DbUser | null`, does not redirect). Challenge list is public; auth gate only applied at submission time.

### 3. Filter UI

`src/features/coding-challenges/challenge-filters.tsx`

Two `<Select>` components (shadcn/ui) for difficulty and topic. On change, updates URL search params with `useRouter().push(...)` — no page reload, server component re-fetches.

Difficulty options: All, Junior, Mid-level, Senior
Topic options: All + unique topics from challenge list

### 4. Challenge card

`src/features/coding-challenges/challenge-card.tsx`

Displays:
- Title (link to `/coding-challenges/[id]`)
- Difficulty badge (color-coded: junior=green, mid=yellow, senior=red — matches existing difficulty badge pattern in question bank)
- Topic tag
- Status icon: checkmark (solved), half-circle (attempted), empty (unsolved)
- Tags (small pill chips)

### 5. Loading skeleton

`src/app/(app)/coding-challenges/loading.tsx` — grid of skeleton cards using existing `page-skeleton-primitives.tsx`.

## Success Criteria

- [ ] Page renders 15 challenge cards with correct difficulty + topic
- [ ] Filtering by difficulty/topic updates the list without full page reload
- [ ] Solved challenges show a green checkmark for returning users
- [ ] Unauthenticated users see the catalog (no auth gate on list)
- [ ] URL search params persist on refresh
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Performance**: 15 challenges is tiny; no pagination needed for MVP. Single Prisma query is fast.
- **Topic list drift**: Topics are derived from seed data at runtime, not hardcoded — stays consistent automatically.
