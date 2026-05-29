---
phase: 2
title: "Mutation Hooks"
status: pending
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 2: Mutation Hooks

## Overview

Convert all client-side `fetch()` mutations to typed `useMutation` hooks. The interview flow (5 mutations in `answer-flow-client.ts`) and study-plan save (`savePlanAction`) get dedicated hook files. The raw fetch functions stay as pure async helpers — the hooks wrap them.

## Requirements

- Functional:
  - Each mutation exposes `isPending`, `isError`, `error`, `mutateAsync`
  - `useInterviewFlow` calls `mutateAsync` from the hooks (no behavior change)
  - `StudyPlanSetupForm` switches from `useActionState` to `useMutation` wrapping the server action
- Non-functional:
  - No changes to API routes or server actions
  - Hooks are co-located with their feature (`src/features/*/hooks/`)
  - `throwOnError: false` at call site — errors stay in mutation state, not thrown to ErrorBoundary

## Architecture

```
answer-flow-client.ts     ← unchanged pure async fns
        ↓
use-interview-mutations.ts  (useMutation wrappers)
        ↓
use-interview-flow.ts       calls mutateAsync() from each hook
```

```
study-plan-actions.ts (server action)
        ↓
use-study-plan-mutations.ts  (useMutation wrapper)
        ↓
study-plan-setup-form.tsx    calls mutation.mutateAsync()
```

## Related Code Files

- Create: `src/features/interview/hooks/use-interview-mutations.ts`
- Create: `src/features/study-plan/hooks/use-study-plan-mutations.ts`
- Modify: `src/features/interview/use-interview-flow.ts`
- Modify: `src/features/study-plan/components/study-plan-setup-form.tsx`

## Implementation Steps

1. **Create `src/features/interview/hooks/use-interview-mutations.ts`**

   ```typescript
   import { useMutation } from '@tanstack/react-query';
   import {
     submitPrimaryAnswer,
     generateFollowUp,
     saveFollowUpAnswer,
     endInterviewSession,
     completeInterviewSession,
   } from '../answer-flow-client';

   /** Submit a primary answer → returns answerId */
   export function useSubmitAnswerMutation() {
     return useMutation({
       mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
         submitPrimaryAnswer(questionId, answer),
     });
   }

   /** Generate follow-up question for an answer */
   export function useGenerateFollowUpMutation() {
     return useMutation({
       mutationFn: (answerId: string) => generateFollowUp(answerId),
     });
   }

   /** Save follow-up answer text */
   export function useSaveFollowUpMutation() {
     return useMutation({
       mutationFn: ({ answerId, followUpAnswer }: { answerId: string; followUpAnswer: string }) =>
         saveFollowUpAnswer(answerId, followUpAnswer),
     });
   }

   /** End session early (no summary) */
   export function useEndSessionMutation() {
     return useMutation({
       mutationFn: (sessionId: string) => endInterviewSession(sessionId),
     });
   }

   /** Complete session (triggers summary generation) */
   export function useCompleteSessionMutation() {
     return useMutation({
       mutationFn: (sessionId: string) => completeInterviewSession(sessionId),
     });
   }
   ```

2. **Modify `src/features/interview/use-interview-flow.ts`**

   Replace each manual `async function` + `await rawFetch()` with `mutateAsync` calls from the hooks. Key pattern:

   ```typescript
   // BEFORE
   async function submitAnswer() {
     state.setPhase('submitting');
     try {
       const answerId = await submitPrimaryAnswer(current.questionId, draft);
       state.setAnswerId(answerId);
       ...
     } catch (e) {
       recordError(e, 'Failed to submit answer');
     }
   }

   // AFTER — hooks declared at top of useInterviewFlow
   const submitAnswer = useMutation({...}); // or imported from use-interview-mutations

   async function handleSubmitAnswer() {
     state.setPhase('submitting');
     const answerId = await submitAnswerMutation.mutateAsync(
       { questionId: current.questionId, answer: draft },
       { onError: (e) => recordError(e, 'Failed to submit answer') },
     );
     state.setAnswerId(answerId);
     ...
   }
   ```

   > Note: `useInterviewFlow` is already a hook (`use` prefix) — calling `useMutation` hooks inside it is valid. The Zustand state machine still owns phase transitions; useMutation only owns network I/O state.

3. **Create `src/features/study-plan/hooks/use-study-plan-mutations.ts`**

   ```typescript
   import { useMutation } from '@tanstack/react-query';
   import { savePlanAction } from '../actions/study-plan-actions';

   export function useSavePlanMutation() {
     return useMutation({
       mutationFn: (formData: FormData) => savePlanAction(formData),
     });
   }
   ```

4. **Modify `src/features/study-plan/components/study-plan-setup-form.tsx`**

   Replace `useActionState` with `useMutation`:

   ```typescript
   // BEFORE
   const [error, action, pending] = useActionState(async (_prev, formData) => {
     try { await savePlanAction(formData); return null; }
     catch (e) { return (e as Error).message; }
   }, null);

   // AFTER
   const mutation = useSavePlanMutation();

   function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
     e.preventDefault();
     mutation.mutate(new FormData(e.currentTarget));
   }
   // pending = mutation.isPending
   // error   = mutation.error?.message ?? null
   ```

   Update `<form onSubmit={handleSubmit}>` (remove `action={action}`).

5. **Compile + lint check**
   ```bash
   pnpm tsc --noEmit
   ```

## Success Criteria

- [ ] `src/features/interview/hooks/use-interview-mutations.ts` created with 5 mutation hooks
- [ ] `src/features/study-plan/hooks/use-study-plan-mutations.ts` created
- [ ] `use-interview-flow.ts` uses `mutateAsync` — no raw fetch calls remain in that file
- [ ] `study-plan-setup-form.tsx` uses `useMutation` — `useActionState` removed
- [ ] Interview flow works end-to-end (submit → follow-up → feedback → next question)
- [ ] `pnpm tsc --noEmit` clean

## Risk Assessment

- **Hook-inside-hook rule**: `useInterviewFlow` is a custom hook, so calling `useMutation` hooks inside it is valid. If it were ever called conditionally, this would break — but it's not.
- **`mutateAsync` throws on error**: unlike `mutate`, `mutateAsync` re-throws. The existing `try/catch` in `use-interview-flow.ts` still handles this correctly.
- **Server action + `useMutation`**: calling a server action from a `mutationFn` works but bypasses `revalidatePath` awareness on the client. Phase 4 adds `queryClient.invalidateQueries` to compensate.
