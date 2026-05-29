---
phase: 1
title: "Answer Review Enhancements"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Answer Review Enhancements

## Overview

The session detail page already fetches answers + `AnswerFeedback` and renders `FeedbackCard`
per question. Two things are missing: (a) the user's answer text is rendered as an unstyled
paragraph inside the question card, and (b) follow-up Q&A is not displayed at all. This phase
adds a styled "Your answer" block and a follow-up section to `session-detail.tsx`.

## Requirements

- Functional:
  - User's answer shown in a clearly labelled, readable card (distinct background)
  - Follow-up question + follow-up answer shown when present (after the primary feedback card)
  - No new API calls — all data already returned by `getSessionDetail`
- Non-functional:
  - No new DB queries — `getSessionDetail` already includes `answer.followUpAnswer` if it exists
  - Mobile-readable layout

## Architecture

```
SessionDetail
  └─ per question article
      ├─ QuestionCard        (question text + topic/order)   ← exists
      ├─ UserAnswerCard      (styled "Your answer" block)    ← NEW
      ├─ FeedbackCard        (scores + betterAnswer)         ← exists, unchanged
      └─ FollowUpBlock       (follow-up Q + follow-up A)     ← NEW (inline, no new component)
```

## Related Code Files

- Modify: `src/features/history/components/session-detail.tsx`
- Modify: `src/features/history/server/history-service.ts` (include `followUpAnswer` field)
- Check: `prisma/schema.prisma` → `UserAnswer.followUpAnswer String? @db.Text`

## Implementation Steps

1. **Verify `UserAnswer` schema has `followUpAnswer`**
   ```bash
   grep "followUpAnswer" prisma/schema.prisma
   ```
   If missing, add `followUpAnswer String? @db.Text` and run `prisma migrate dev`.

2. **Extend `getSessionDetail` to include `followUpAnswer`**
   In `src/features/history/server/history-service.ts`, inside the `questions` include:
   ```ts
   include: { answer: { include: { feedback: true } } }
   // Change to:
   include: {
     answer: {
       select: {
         id: true,
         answer: true,
         followUpAnswer: true,   // ← add
         feedback: true,
       },
     },
   },
   ```
   Update `toFeedbackPayload` shape + the returned question map accordingly.

3. **Style the user answer in `session-detail.tsx`**
   Replace the bare `<p>` with a labelled card:
   ```tsx
   {question.answer && (
     <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
       <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
         Your answer
       </p>
       <p className="whitespace-pre-wrap text-sm leading-relaxed">
         {question.answer.answer}
       </p>
     </div>
   )}
   ```

4. **Add follow-up block after `FeedbackCard`**
   ```tsx
   {question.answer?.followUpAnswer && (
     <div className="space-y-3 rounded-lg border border-border/60 bg-card p-5">
       <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
         Follow-up
       </p>
       {question.followUpQuestion && (
         <p className="font-medium leading-relaxed">{question.followUpQuestion}</p>
       )}
       <div className="rounded-md bg-muted/30 p-3">
         <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
           Your follow-up answer
         </p>
         <p className="whitespace-pre-wrap text-sm leading-relaxed">
           {question.answer.followUpAnswer}
         </p>
       </div>
     </div>
   )}
   ```
   Note: `question.followUpQuestion` must also be included from `InterviewQuestion` model.
   Check schema for the field name (`followUp String?` or `followUpQuestion String?`).

5. **TypeScript check**
   ```bash
   pnpm tsc --noEmit
   ```

## Success Criteria

- [ ] User's answer is shown in a labelled muted card (not a bare paragraph)
- [ ] Follow-up question text is shown when `InterviewQuestion.followUp` is populated
- [ ] Follow-up answer is shown below the follow-up question when answered
- [ ] Sessions without follow-ups render identically to before (no layout regression)
- [ ] `pnpm tsc --noEmit` clean

## Risk Assessment

- **`followUpAnswer` field may not exist on `UserAnswer`** — check schema first (step 1). Low risk; easy add.
- **`followUpQuestion` field name** — the `InterviewQuestion` model uses `followUp String?` per seed schema; confirm the actual column name before referencing it.
