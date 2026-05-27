# Phase 03 — Feedback & Summary

## Context Links

- [PRD §7.6 AI Feedback and Scoring](../../PRD.md), [§7.7 Better Answer](../../PRD.md), [§7.8 Session Summary](../../PRD.md), [§10.4 History](../../PRD.md)
- [System Architecture §6 Data Model](../../docs/system-architecture.md#6-data-model-prisma), [§5 Orchestration](../../docs/system-architecture.md#5-ai-orchestration-layer)

## Overview

- **Priority:** P0
- **Status:** ✅ complete for MVP scope — feedback, summary, history (with filters), retry flow, copy confirm all shipped
- Generate structured feedback per answer (6-dimension scoring + better answer), produce session summary on completion, build history pages.

## Key Insights

- Better-answer is just a structured field inside the evaluate response — don't make it a second AI call (PRD §7.7 has tiers, but MVP returns one well-crafted version).
- Session summary aggregates feedback rows + asks AI for narrative — pass condensed data, not raw text, to keep token cost down.
- History page reuses the same components that render live feedback — keep `FeedbackCard` data-driven, agnostic to source.
- Overall score on session = weighted average of per-answer scores. Pre-compute on completion to avoid recomputing on dashboard reads.

## Requirements

**Functional**
- After answer submission, AI generates 6-dimension scored feedback + better answer (PRD §7.6).
- User sees feedback rendered with scores + suggestions.
- User can copy the better answer (PRD §7.7 acceptance criteria).
- On session complete, AI generates summary with strong/weak areas, recommendations (PRD §7.8).
- User can view past sessions and drill into any one to re-read questions, answers, feedback.

**Non-functional**
- Feedback stream visible within 2s of submission.
- Summary generated in <10s.
- History list loads in <1s for users with up to 100 sessions.

## Architecture

- `FeedbackService` orchestrates: validates answer, calls orchestrator `evaluate_answer`, persists `AnswerFeedback`, updates session running-total.
- `SummaryService` runs only on `POST /api/sessions/:id/complete`. Reads all feedback for the session, builds compact payload, calls `generate_summary`, persists `SessionSummary`.
- History uses RSC for the list page (no client JS), client component for filters.

## Related Code Files

**Create**
- `src/features/feedback/server/feedback-service.ts`
- `src/features/feedback/server/summary-service.ts`
- `src/features/feedback/schemas.ts` — Zod for feedback + summary AI outputs
- `src/features/feedback/components/feedback-card.tsx`
- `src/features/feedback/components/score-radar-mini.tsx`
- `src/features/feedback/components/better-answer-card.tsx`
- `src/features/feedback/components/dimension-score-row.tsx`
- `src/features/feedback/components/summary-view.tsx`
- `src/features/feedback/hooks/use-streamed-feedback.ts`
- `src/features/history/server/history-service.ts`
- `src/features/history/components/session-list-item.tsx`
- `src/features/history/components/session-detail.tsx`
- `src/app/(app)/practice/[sessionId]/complete/page.tsx` — summary view
- `src/app/(app)/history/page.tsx`
- `src/app/(app)/history/[sessionId]/page.tsx`
- `src/app/api/answers/[id]/feedback/generate/route.ts` — SSE
- `src/app/api/sessions/[id]/complete/route.ts`
- `src/app/api/sessions/route.ts` — already exists; add GET for list

**Modify**
- `src/features/interview/components/interview-shell.tsx` — render `<FeedbackCard>` once stream completes
- `src/lib/ai/prompts/evaluate.ts` — refine output schema if needed
- `src/lib/ai/prompts/summary.ts` — confirm aggregation payload shape

**Delete** — n/a

## Implementation Steps

1. Define Zod schema for `AnswerFeedback` AI output — must match Prisma model fields one-to-one (6 dimensions, arrays, better-answer, senior-level addition).
2. Implement `FeedbackService.generate(answerId)` — loads answer + question + user level, calls `orchestrator.stream({ type: 'evaluate_answer', input })`, streams chunks, persists final `AnswerFeedback`.
3. Wire `/api/answers/[id]/feedback/generate/route.ts` — auth, ownership check, call service, return SSE.
4. Build `FeedbackCard` — renders score header, dimension bars, "what went well", "what was missing", better-answer, recommendations. Pure component, data-driven.
5. Build `BetterAnswerCard` with copy-to-clipboard button (toast on success).
6. Hook into interview shell — `useStreamedFeedback` triggers after answer submit.
7. Implement `SummaryService.generate(sessionId)` — fetch all feedback rows, build aggregate (avg per dimension, topic scores, common missing points), call `orchestrator.run({ type: 'generate_summary', input })`. Persist `SessionSummary`. Update `InterviewSession.overallScore` + `completedAt`.
8. Wire `/api/sessions/[id]/complete/route.ts` — guards: session belongs to user, has ≥1 answered question (PRD §7.8 — summary still generated if user ends early with ≥1 answer).
9. Build summary view per PRD §7.8 — overall score header, strong/weak areas, recommended next, list of saved better answers (clickable to expand).
10. Build history list page — RSC fetches sessions for user, ordered by `startedAt desc`, shows topic chips, score, duration.
11. Build history detail page — reuses `<FeedbackCard>` for each answer; shows summary at top.
12. Add filter component (topic, score range, date range) on history list.
13. Test failure path: kill AI mid-evaluate → fallback feedback persisted with `errorReason`; UI shows retry CTA.
14. Test summary edge case: user ends after 1 answer → summary still generates.
15. `pnpm tsc --noEmit` clean.

## Todo List

- [x] Feedback Zod schema matches Prisma model — `evaluateOutputSchema` maps into `AnswerFeedback`
- [x] FeedbackService persists feedback with telemetry — `features/feedback/server/feedback-service.ts`
- [x] SSE feedback endpoint streams to client — `POST /api/answers/[id]/feedback/generate`
- [x] FeedbackCard renders all PRD §7.6 fields
- [x] Better answer copy button works — `BetterAnswerCard` copies to clipboard with inline ✓ Copied confirm (2s) — no toast lib needed
- [x] SummaryService aggregates correctly — compact per-answer feedback payload into `generate_summary`
- [x] Session-complete endpoint guards and updates overall score
- [x] Summary page renders all PRD §7.8 sections
- [x] History list shows past sessions with filters — URL-driven (topic + min score + date range) via `history-filter-bar.tsx` + `history-filters-schema.ts`; applied in `listSessions()` Prisma where clause
- [x] History detail re-renders past feedback identically to live
- [x] Retry flow works when AI fails — `FeedbackFailedNotice` in `interview-main-panel.tsx` with Retry + Continue CTAs; flow exposes `retryFeedback`; service already idempotent (returns existing `AnswerFeedback` if present)

## Success Criteria

- Complete a session of 3 answers → see summary with realistic strong/weak areas pulled from actual feedback.
- Open a 3-day-old session from history → all questions, answers, feedback render correctly.
- Ending early with 1 answer still produces a summary.
- AI failure during evaluate → user sees actionable error, can retry, no data loss.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Scoring inconsistency across runs | Prompt fixes dimension definitions; few-shot example in prompt; normalize 1-5 in backend |
| Better answer too long/verbose | Cap output tokens; prompt requests "concise interview-ready"; offer "regenerate shorter" UX later |
| Summary aggregation token blow-up | Pass condensed dimension averages + top 3 missing points per answer, not raw text |
| History pagination performance | Index `(userId, startedAt)`; cursor pagination from start |

## Security Considerations

- Ownership check on every feedback + summary endpoint.
- Don't expose other users' session IDs in URLs (they're CUIDs, but verify ownership server-side).
- PII: user answers may contain personal info — never log to PostHog event properties.

## Next Steps

Phase 04 reads from `AnswerFeedback` + `SessionSummary` to build the progress dashboard.
