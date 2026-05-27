# Phase 02 — Interview Flow

## Context Links

- [PRD §7.4 Interview Session](../../PRD.md), [§7.5 AI Question Generation](../../PRD.md), [§8 AI Behavior](../../PRD.md), [§9 Prompts](../../PRD.md), [§14 API](../../PRD.md)
- [System Architecture §5 AI Orchestration](../../docs/system-architecture.md#5-ai-orchestration-layer), [§7 State Machine](../../docs/system-architecture.md#7-session-state-machine)

## Overview

- **Priority:** P0
- **Status:** complete for MVP scope
- Build the AI orchestrator, session lifecycle endpoints, and the live interview UI with streaming responses.

## Key Insights

- The orchestrator is THE architectural choke point. Build it once, build it right. All future AI features (voice, resume) slot in here.
- Use `generateObject` from Vercel AI SDK with Zod — gives structured JSON or throws; never returns a malformed payload.
- Stream questions and feedback via SSE. PRD §11.2 — save user answer to DB BEFORE invoking AI. If AI fails, answer survives, user can retry feedback.
- Hybrid question strategy: 70% pull from `SeedQuestion` and ask AI to rephrase slightly; 30% pure AI generation. Tracks `seedQuestionId` for analytics.
- Zustand state machine mirrors server state — don't let it become authoritative.

## Requirements

**Functional**
- User can create a session (PRD §14.1) — mode, topics, difficulty.
- AI generates first question and streams to client.
- User submits answer; answer saved immediately.
- AI evaluates and streams feedback.
- Session moves to next question or ends after N questions.
- User can end session early.

**Non-functional**
- First AI token < 2s.
- All AI failures persist a fallback message; user can retry.
- Session state recoverable on page reload.

## Architecture

- Route Handlers in `src/app/api/` are thin: auth → service call → stream.
- Services in `src/features/interview/server/` own business logic.
- `lib/ai/orchestrator.ts` is the only module that talks to AI providers.
- Zustand store mirrors `InterviewSession` shape; hydrates on mount from server.

## Related Code Files

**Create**
- `src/lib/ai/client.ts` — AI SDK provider config (OpenAI + Anthropic)
- `src/lib/ai/model-router.ts` — task → model mapping
- `src/lib/ai/cost-meter.ts` — token accounting, writes `AICall` rows
- `src/lib/ai/orchestrator.ts` — main entry: `run()` + `stream()`
- `src/lib/ai/prompts/question.ts` (PRD §9.1)
- `src/lib/ai/prompts/followup.ts` (PRD §9.2)
- `src/lib/ai/prompts/evaluate.ts` (PRD §9.3)
- `src/lib/ai/prompts/summary.ts` (PRD §9.4)
- `src/lib/ai/sanitize.ts` — strip prompt-injection patterns
- `src/features/interview/schemas.ts` — Zod for API + AI outputs
- `src/features/interview/server/session-service.ts`
- `src/features/interview/server/question-service.ts`
- `src/features/interview/store.ts` — Zustand state machine
- `src/features/interview/hooks/use-interview-session.ts`
- `src/features/interview/hooks/use-streamed-question.ts`
- `src/features/interview/hooks/use-streamed-feedback.ts`
- `src/features/interview/components/interview-shell.tsx`
- `src/features/interview/components/question-panel.tsx`
- `src/features/interview/components/answer-input.tsx`
- `src/features/interview/components/progress-indicator.tsx`
- `src/app/(app)/practice/[sessionId]/page.tsx`
- `src/app/api/sessions/route.ts` — POST create
- `src/app/api/sessions/[id]/route.ts` — GET, DELETE
- `src/app/api/sessions/[id]/questions/generate/route.ts` — SSE
- `src/app/api/sessions/[id]/end/route.ts`
- `src/app/api/answers/route.ts` — POST submit
- `src/app/api/rate-limit/middleware.ts` (used by middleware.ts)
- `src/middleware.ts` — auth + rate limit
- `src/lib/rate-limit/upstash.ts`

**Modify**
- `prisma/schema.prisma` — verify all models from arch doc present
- `.env.local.example` — add Upstash + AI provider keys

## Implementation Steps

1. Install: `ai @ai-sdk/openai @ai-sdk/anthropic @upstash/ratelimit @upstash/redis`.
2. Implement `lib/ai/client.ts` — export `openai`, `anthropic` providers.
3. Implement `model-router.ts` — map each `AITask['type']` to `{provider, model}`. Cheap for question gen, premium for evaluate.
4. Implement `cost-meter.ts` — wraps a result, writes `AICall` row.
5. Implement orchestrator: `run<T>(task)` uses `generateObject`; `stream<T>(task)` uses `streamObject`. Both apply sanitization, retry, fallback, cost meter.
6. Write 4 prompt builders — pure functions taking typed input, returning a string. Mirror PRD §9 verbatim, parameterize templates.
7. Define Zod schemas for each AI task input + output in `interview/schemas.ts`.
8. Implement `session-service.ts` — `createSession`, `getSession`, `endSession`.
9. Implement `question-service.ts` — `nextQuestion()` does hybrid: 70% pick unused `SeedQuestion` matching session topics+difficulty, ask AI to rephrase; 30% pure AI gen. Persists `InterviewQuestion`.
10. Wire Route Handlers per [arch §9 API table](../../docs/system-architecture.md#9-api-contract). Each: auth → rate limit → service → response.
11. SSE endpoints use `result.toDataStreamResponse()` from AI SDK.
12. Build Zustand store — state: `currentQuestion`, `draftAnswer`, `phase`, `progress`. Actions: `submitAnswer`, `goToNext`, `endEarly`.
13. Build hooks — `useStreamedQuestion` and `useStreamedFeedback` use `useChat`/`useObject` from AI SDK.
14. Build interview UI per PRD §12.3 layout. Mobile = single column.
15. Implement `src/middleware.ts` — runs Supabase session refresh + Upstash rate limit on `/api/*`.
16. Manually test end-to-end: create session → generate question (stream visible) → submit answer → see status update.
17. `pnpm tsc --noEmit` clean.

## Todo List

- [x] AI provider clients configured — Groq (default) + OpenAI + Anthropic via Vercel AI SDK 6
- [x] `model-router.ts` returns correct model per task — per-tier env override (`LLM_CHEAP_PROVIDER`, `LLM_SMART_PROVIDER`)
- [x] Cost meter writes `AICall` rows — `lib/ai/cost-meter.ts` with USD-per-million-token rates
- [x] Orchestrator `runAITask()` validates I/O with Zod + 1 retry
- [x] Orchestrator `stream()` returns AsyncIterable — `streamAITask()` uses AI SDK `streamObject`
- [x] All 4 prompts implemented from PRD §9 — `lib/ai/prompts/{question,followup,evaluate,summary}-prompt.ts`
- [x] User input sanitized — `lib/ai/sanitize.ts` (injection patterns + length cap)
- [x] Session-service read/end endpoints complete — `GET /api/sessions/[id]`, `DELETE /api/sessions/[id]`, and `POST /api/sessions/[id]/end`
- [x] Question-service hybrid strategy implemented — `features/interview/server/question-service.ts` (70% seed, topic rotation, dedupe-by-session)
- [x] SSE question generation endpoint — `POST /api/sessions/[id]/questions/generate` streams partial objects and final persisted question
- [x] Answer submission persists before any AI call — `POST /api/answers`
- [ ] Middleware enforces auth + rate limit — *partial*: `proxy.ts` refreshes session; rate limit guard exists in `lib/rate-limit/guard.ts` but is called per-route, not from proxy
- [x] Zustand state machine — `features/interview/interview-store.ts` mirrors phase, question, draft, progress, and follow-up UI state
- [x] Interview UI responsive — `features/interview/interview-shell.tsx`
- [x] Interview UI consumes streamed questions — client SSE reader updates loading state with partial question text
- [x] Page reload mid-session resumes correctly — server is source of truth, page picks up active question
- [x] Follow-up prompt wired into the flow — `POST /api/answers/[id]/followup` generates follow-up and saves follow-up answers

## How to finish Phase 02

1. [x] Switch `POST /api/sessions/[id]/questions/generate` to SSE — `streamAITask()` added next to `runAITask`; route streams partial objects and final persisted question.
2. [x] Update `InterviewShell` to consume the streamed question response.
3. [x] Wire follow-up: after answer submit, optionally call `/api/answers/[id]/followup` which runs `generate_followup` task; UI shows extra input.
4. [x] Expand session-service: read endpoint (`GET /api/sessions/[id]`), end endpoint (`POST .../end`), with ownership guards.
5. [x] Consider extracting Zustand store if state grows beyond what local state handles (timer, draft persistence, etc.) — extracted for the Phase 02 flow state.

## Success Criteria

- A user runs a 3-question session end-to-end without errors.
- Pulling network mid-question and reloading → session resumes from server state.
- Killing the AI key mid-evaluation → user sees fallback message + retry button; answer is not lost.
- `AICall` table populated with token counts.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| AI returns invalid JSON | `generateObject` + retry; fallback message persisted |
| SSE chunks lost on flaky network | Resumable via session GET endpoint — re-fetch latest question state |
| Hybrid question logic biases toward seeds | Add `seedQuestionUsageCount` metric; tune the 70/30 split |
| Rate limit too strict for power users | Start at 30 AI calls/hour/user; revisit after dogfooding |
| Prompt drift across model swaps | Each prompt file pure + versioned; never inline in services |

## Security Considerations

- All Route Handlers call `getCurrentUser()` first; 401 if missing.
- Rate limit by `userId` (authed) or IP (guest).
- Sanitize before prompt assembly; cap user input at 4000 chars.
- Never log raw AI keys; redact in error reporting.
- CORS locked to app origin.

## Next Steps

Phase 03 builds full feedback generation, scoring persistence, and session summaries on top of the orchestrator.
