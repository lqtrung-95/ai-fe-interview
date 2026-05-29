---
phase: 3
title: "Client Queries & Optimistic Updates"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Client Queries & Optimistic Updates

## Overview

Add `useQuery` for data that currently requires a full page reload to reflect client-initiated changes. The primary target is study-plan progress (studied question count + studied IDs) — currently a server-only read that forces a hard reload after `toggleStudiedAction`. Convert `MarkStudiedButton` to an optimistic `useMutation` with rollback.

## Requirements

- Functional:
  - Toggling a question as studied updates the UI instantly (optimistic), no reload needed
  - If the toggle fails the server-side, the button reverts to its pre-click state
  - Study-plan progress count updates client-side after toggle without a page navigation
- Non-functional:
  - No new API routes — the server action is called from within `mutationFn`
  - RSC pages still render the correct initial state via SSR (no flash of wrong state)
  - `staleTime: 0` for study progress (always re-fetch in background on mount to stay fresh)

## Architecture

```
RSC page (server)
  └─ passes initialStudied + hasPlan as props  →  MarkStudiedButton
                                                       ↓
                                              useMarkStudiedMutation()
                                                 (optimistic toggle)
                                                       ↓
                                              on success: invalidate studyPlanKeys.progress()
                                                       ↓
                                          useStudyPlanProgressQuery (re-fetches)
                                                       ↓
                                          updated studied count shown without reload
```

Two new hooks:
- `useMarkStudiedMutation` — wraps `toggleStudiedAction`, optimistic update on `onMutate`, rollback on `onError`
- `useStudyPlanProgressQuery` — fetches `/api/study-plan/progress` (new lightweight endpoint returning `{ studiedIds: string[], totalCount: number }`)

> Adding a thin GET endpoint is necessary because TanStack Query needs a fetch-able URL for `useQuery`. The server action is write-only; reads need a route.

## Related Code Files

- Create: `src/features/study-plan/hooks/use-mark-studied-mutation.ts`
- Create: `src/features/study-plan/hooks/use-study-plan-progress-query.ts`
- Create: `src/app/api/study-plan/progress/route.ts`
- Modify: `src/features/study-plan/components/mark-studied-button.tsx`
- Modify: `src/features/study-plan/hooks/use-study-plan-mutations.ts` (add `onSuccess` invalidation)

## Implementation Steps

1. **Create `src/app/api/study-plan/progress/route.ts`**

   Lightweight endpoint — returns studied IDs for the current user.

   ```typescript
   import { NextResponse } from 'next/server';
   import { requireUser } from '@/lib/auth/session';
   import { getStudyPlanStatus } from '@/features/study-plan/server/study-plan-service';

   export async function GET() {
     const user = await requireUser();
     const { hasPlan, studiedIds } = await getStudyPlanStatus(user.id);
     return NextResponse.json({
       hasPlan,
       studiedIds: [...studiedIds],          // Set → Array for JSON
     });
   }
   ```

2. **Create `src/features/study-plan/hooks/use-study-plan-progress-query.ts`**

   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { studyPlanKeys } from '@/lib/query/keys';

   interface StudyPlanProgress {
     hasPlan: boolean;
     studiedIds: string[];
   }

   async function fetchStudyPlanProgress(): Promise<StudyPlanProgress> {
     const res = await fetch('/api/study-plan/progress');
     if (!res.ok) throw new Error('Failed to fetch study plan progress');
     return res.json();
   }

   export function useStudyPlanProgressQuery(initialData?: StudyPlanProgress) {
     return useQuery({
       queryKey: studyPlanKeys.progress(),
       queryFn: fetchStudyPlanProgress,
       staleTime: 0,          // always re-validate in background on mount
       initialData,           // seed from SSR props to avoid loading flash
     });
   }
   ```

3. **Create `src/features/study-plan/hooks/use-mark-studied-mutation.ts`**

   ```typescript
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { studyPlanKeys } from '@/lib/query/keys';
   import { toggleStudiedAction } from '../actions/study-plan-actions';

   export function useMarkStudiedMutation(seedQuestionId: string) {
     const queryClient = useQueryClient();

     return useMutation({
       mutationFn: () => toggleStudiedAction(seedQuestionId),

       // Optimistic update — flip the studied state immediately
       onMutate: async () => {
         // Cancel in-flight refetches to avoid overwriting optimistic state
         await queryClient.cancelQueries({ queryKey: studyPlanKeys.progress() });

         const previous = queryClient.getQueryData(studyPlanKeys.progress());

         queryClient.setQueryData(studyPlanKeys.progress(), (old: { studiedIds: string[] } | undefined) => {
           if (!old) return old;
           const wasStudied = old.studiedIds.includes(seedQuestionId);
           return {
             ...old,
             studiedIds: wasStudied
               ? old.studiedIds.filter((id) => id !== seedQuestionId)
               : [...old.studiedIds, seedQuestionId],
           };
         });

         return { previous }; // context for rollback
       },

       // Rollback on server error
       onError: (_err, _vars, context) => {
         if (context?.previous !== undefined) {
           queryClient.setQueryData(studyPlanKeys.progress(), context.previous);
         }
       },

       // Sync with server truth after success or error
       onSettled: () => {
         queryClient.invalidateQueries({ queryKey: studyPlanKeys.progress() });
       },
     });
   }
   ```

4. **Modify `src/features/study-plan/components/mark-studied-button.tsx`**

   ```typescript
   'use client';

   import { CheckCircle2, Circle } from 'lucide-react';
   import { useMarkStudiedMutation } from '../hooks/use-mark-studied-mutation';
   import { useStudyPlanProgressQuery } from '../hooks/use-study-plan-progress-query';

   interface Props {
     seedQuestionId: string;
     /** SSR initial state — seeded into the query cache to avoid loading flash */
     initialStudied: boolean;
     hasPlan: boolean;
   }

   export function MarkStudiedButton({ seedQuestionId, initialStudied, hasPlan }: Props) {
     const { data } = useStudyPlanProgressQuery();
     const mutation = useMarkStudiedMutation(seedQuestionId);

     // Derive studied from cache; fall back to SSR prop before first fetch
     const studied = data
       ? data.studiedIds.includes(seedQuestionId)
       : initialStudied;

     if (!hasPlan) {
       return (
         <p className="text-xs text-muted-foreground">
           <a href="/study-plan" className="underline underline-offset-2 hover:text-foreground">
             Create a study plan
           </a>{' '}
           to track your progress here.
         </p>
       );
     }

     return (
       <button
         onClick={() => mutation.mutate()}
         disabled={mutation.isPending}
         className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
           studied
             ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
             : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
         }`}
       >
         {studied
           ? <CheckCircle2 className="h-4 w-4 shrink-0" />
           : <Circle className="h-4 w-4 shrink-0" />}
         {mutation.isPending ? 'Saving…' : studied ? 'Studied ✓' : 'Mark as studied'}
       </button>
     );
   }
   ```

5. **Compile check**
   ```bash
   pnpm tsc --noEmit
   ```

## Success Criteria

- [ ] `/api/study-plan/progress` GET endpoint returns `{ hasPlan, studiedIds }` for authenticated users
- [ ] `MarkStudiedButton` toggles instantly without page reload
- [ ] On network error, button reverts to pre-click state
- [ ] `useStudyPlanProgressQuery` seeds from SSR `initialStudied` prop — no loading flash
- [ ] React Query Devtools shows `studyPlan.progress` cache entry updating on toggle
- [ ] `pnpm tsc --noEmit` clean

## Risk Assessment

- **Auth on API route**: `requireUser()` throws/redirects if unauthenticated — same guard already used on all other API routes. Low risk.
- **Optimistic state and concurrent toggles**: If the user clicks rapidly, multiple `onMutate` calls queue up. `cancelQueries` + `onSettled` invalidation ensures eventual consistency after the last mutation settles.
- **`initialData` staleness**: TanStack Query treats `initialData` as immediately stale when `staleTime: 0` — it will background-refetch on mount, which is the intended behavior (SSR truth → client truth).
