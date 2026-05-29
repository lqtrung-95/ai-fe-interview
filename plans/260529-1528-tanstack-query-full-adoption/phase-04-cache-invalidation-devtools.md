---
phase: 4
title: "Cache Invalidation & Devtools"
status: pending
priority: P2
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Cache Invalidation & Devtools

## Overview

Wire `queryClient.invalidateQueries` to every mutation that changes server state visible in a cached query. Add the `savePlanAction` invalidation (clears study-plan progress after plan reconfiguration). Verify DevTools show correct cache behaviour. Do a final type-check and smoke-test pass.

## Requirements

- Functional:
  - Saving a new study plan invalidates `studyPlanKeys.progress()` — progress query re-fetches
  - Completing an interview session invalidates `dashboardKeys.all()` — dashboard data re-fetches on next visit
  - No stale data shown anywhere after a mutation settles
- Non-functional:
  - All invalidations go through `queryClient.invalidateQueries` — no `router.refresh()` hacks
  - `revalidatePath` in server actions stays as-is for RSC page cache; TQ invalidation is for client cache only

## Architecture

```
Mutation                       →  invalidateQueries target
──────────────────────────────────────────────────────────
toggleStudiedAction            →  studyPlanKeys.progress()      (Phase 3, onSettled)
savePlanAction                 →  studyPlanKeys.all()            (this phase)
completeInterviewSession       →  dashboardKeys.all()            (this phase)
endInterviewSession (early)    →  dashboardKeys.all()            (this phase)
```

Invalidation hierarchy: `studyPlanKeys.all()` matches `['studyPlan']` and all sub-keys — wiping progress + any per-question cache. Use the narrowest key that covers the stale data.

## Related Code Files

- Modify: `src/features/study-plan/hooks/use-study-plan-mutations.ts`
- Modify: `src/features/interview/hooks/use-interview-mutations.ts`

## Implementation Steps

1. **Add `onSuccess` to `useSavePlanMutation`**

   ```typescript
   // src/features/study-plan/hooks/use-study-plan-mutations.ts
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { studyPlanKeys } from '@/lib/query/keys';
   import { savePlanAction } from '../actions/study-plan-actions';

   export function useSavePlanMutation() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (formData: FormData) => savePlanAction(formData),
       onSuccess: () => {
         // Plan changed — progress counts and studied IDs may all be different
         queryClient.invalidateQueries({ queryKey: studyPlanKeys.all() });
       },
     });
   }
   ```

2. **Add `onSuccess` to `useEndSessionMutation` and `useCompleteSessionMutation`**

   ```typescript
   // src/features/interview/hooks/use-interview-mutations.ts
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { dashboardKeys } from '@/lib/query/keys';
   import { endInterviewSession, completeInterviewSession, ... } from '../answer-flow-client';

   export function useEndSessionMutation() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (sessionId: string) => endInterviewSession(sessionId),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
       },
     });
   }

   export function useCompleteSessionMutation() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (sessionId: string) => completeInterviewSession(sessionId),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
       },
     });
   }
   ```

   > `dashboardKeys.all()` invalidation is a background signal — when the user navigates to `/dashboard` next, the query re-fetches. No visible effect during the current session.

3. **Verify Devtools behaviour** (manual check list)

   Open `http://localhost:3000` in dev, open React Query Devtools:
   - [ ] Toggle a studied question → see `['studyPlan','progress']` entry optimistically update then settle
   - [ ] Save study plan settings → see `['studyPlan']` entries marked stale and refetched
   - [ ] Complete an interview → see `['dashboard']` entry marked stale

4. **Final compile + lint**
   ```bash
   pnpm tsc --noEmit && pnpm lint
   ```

## Success Criteria

- [ ] `useSavePlanMutation` invalidates `studyPlanKeys.all()` on success
- [ ] `useEndSessionMutation` and `useCompleteSessionMutation` invalidate `dashboardKeys.all()` on success
- [ ] Devtools shows correct stale/fetching transitions for all three scenarios above
- [ ] `pnpm tsc --noEmit` and `pnpm lint` both pass clean
- [ ] No `router.refresh()` or `window.location.reload()` calls added (existing `window.location.href` redirect in `finishQuestion` is intentional navigation, not a cache workaround)

## Risk Assessment

- **Over-invalidation**: Using `studyPlanKeys.all()` after `savePlanAction` invalidates all study-plan sub-keys. This is intentional — a plan change can affect all studied counts. If performance becomes an issue, narrow to specific keys.
- **Dashboard invalidation on session end**: The dashboard query only re-fetches when the user actually navigates to `/dashboard`. The invalidation just marks it stale; no wasted network request happens immediately.
- **`revalidatePath` + `invalidateQueries` co-existence**: Both run after mutations. `revalidatePath` clears the RSC page cache on the server; `invalidateQueries` clears the TanStack Query client cache. They are independent and complementary — not redundant.
