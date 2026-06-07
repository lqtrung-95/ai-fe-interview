---
phase: 5
title: "AI Code Review"
status: completed
priority: P2
effort: "3h"
dependencies: [4]
---

# Phase 5: AI Code Review

## Overview

After a successful submission, Pro users can request an AI analysis of their code. The AI reviews time/space complexity, identifies anti-patterns, suggests improvements, and offers a senior-level alternative approach. Result is persisted to `CodingSubmission.aiReview` and streamed to the client.

## Architecture

```
POST /api/coding-challenges/[id]/submissions/[submissionId]/ai-review
  → verify auth + Pro status
  → fetch submission (verify ownership + status = 'passed')
  → call AI orchestrator (new task type: 'review_code')
  → stream response to client
  → persist to CodingSubmission.aiReview on stream end

Client: "Get AI Review" button in TestResultsPanel (Pro-gated)
  → streams text into AiCodeReviewPanel below test results
```

**AI task: `review_code`**

Routing: `LLM_SMART_PROVIDER` (same as answer evaluation — quality matters here).

Output: plain markdown text (streamed), not structured JSON. The review is narrative, not scored. Use `streamText` from Vercel AI SDK (not `generateObject`).

## Related Code Files

- Create: `src/app/api/coding-challenges/[id]/submissions/[submissionId]/ai-review/route.ts`
- Modify: `src/features/interview/ai-schemas.ts` — add `review_code` task type
- Create: `src/lib/ai/prompts/code-review-prompt.ts`
- Modify: `src/lib/ai/orchestrator.ts` — add `review_code` branch
- Create: `src/features/coding-challenges/ai-code-review-panel.tsx`
- Modify: `src/features/coding-challenges/test-results-panel.tsx` — add "Get AI Review" button

## Implementation Steps

### 1. Prompt (`src/lib/ai/prompts/code-review-prompt.ts`)

```ts
export function buildCodeReviewPrompt(input: {
  challengeTitle: string;
  challengeDescription: string;
  userCode: string;
  testsPassed: string; // e.g. "5 / 5"
}): { system: string; user: string }
```

System prompt focuses the AI on:
- **Time & space complexity** — Big O analysis with explanation
- **Correctness edge cases** — what the tests don't cover (e.g. null inputs, circular refs)
- **Code clarity** — naming, readability, modern JS idioms
- **Alternative approach** — one different strategy with trade-off summary
- **Frontend relevance** — how this pattern appears in real frontend work (React, browser APIs)

Format: markdown with `##` headers. Concise — target 300–500 words.

### 2. Orchestrator addition

Add `review_code` to the `AITask` union in `ai-schemas.ts`:
```ts
export type ReviewCodeInput = {
  challengeTitle: string;
  challengeDescription: string;
  userCode: string;
  testsPassed: string;
};
```

In `orchestrator.ts`, add a `runStreamingAITask` function (or a new `streamCodeReview` export) that uses `streamText` instead of `generateObject` — the review is free-form markdown, not a structured schema.

### 3. API route

```ts
// POST /api/coding-challenges/[id]/submissions/[submissionId]/ai-review
export const runtime = 'nodejs';
export const maxDuration = 30;

// 1. requireUser()
// 2. Verify user.isPro — return 403 if not Pro
// 3. Fetch submission: verify ownership + challenge matches [id]
// 4. Reject if submission.status !== 'passed' (only review passing solutions)
// 5. Reject if submission.aiReview already set (idempotent — return cached review)
// 6. Stream AI response via streamText
// 7. On stream completion: prisma.codingSubmission.update({ aiReview: fullText })
// 8. Return streaming Response (text/event-stream)
```

Cache check (step 5): if `aiReview` already exists, return it immediately as a non-streaming response — avoids burning AI tokens on repeat requests.

### 4. Client streaming

`src/features/coding-challenges/ai-code-review-panel.tsx`

```tsx
// Uses fetch + ReadableStream to consume the SSE response
// Shows a "Analyzing your code..." skeleton while streaming
// Renders completed markdown with existing prose styling (same as betterAnswer in feedback)
// "Get AI Review" button: disabled while streaming, hidden once review is shown
```

The streaming implementation mirrors how the question generation SSE is consumed in `use-question-stream.ts` — use the same `ReadableStreamDefaultReader` pattern.

### 5. Pro gate

"Get AI Review" button is only rendered if `user.isPro`. If not Pro, show a locked badge with a link to `/upgrade`. Free users still see the test pass/fail results — just not the AI analysis.

### 6. Cost telemetry

Record via `recordAICall` with `task: 'review_code'`. The code review prompt is short (~500 tokens input), so cost is minimal per review.

## Success Criteria

- [ ] Pro user sees "Get AI Review" button after passing all tests
- [ ] Clicking streams markdown review into the panel
- [ ] Non-Pro users see an upgrade prompt instead of the button
- [ ] Repeat requests return the cached review without a new AI call
- [ ] Review is persisted to `CodingSubmission.aiReview` in DB
- [ ] Submitting non-passing code returns 400 (review only available on passing submissions)
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Streaming + persistence**: The stream must complete before persisting. Use the `onFinish` callback from Vercel AI SDK's `streamText` to trigger the DB write — same pattern as session summary generation.
- **Review on failing submissions**: Rejected by the API (only `status = 'passed'`). This avoids reviewing buggy code as if it's correct.
- **Token cost**: Code review is relatively cheap (~500 in, ~600 out). One review per passing submission, cached after first generation.
