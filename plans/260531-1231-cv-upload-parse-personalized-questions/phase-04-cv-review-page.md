---
phase: 4
title: "CV Review Page"
status: pending
priority: P2
effort: "3h"
dependencies: [phase-02-cv-upload-llm-parse]
---

# Phase 4: CV Review Page

## Overview

A dedicated page (`/cv-review`) where users get AI feedback on their CV: ATS compatibility,
impact quantification, verb strength, and frontend-specific improvement suggestions. Single
LLM call; renders structured, actionable feedback. Lower priority — can ship after Phase 3.

## Requirements

- Functional:
  - Accessible from settings page "Review my CV →" link (only when `cvData` exists)
  - One-click generate: calls `/api/cv/review` → streams or returns structured feedback
  - Feedback sections: Overall score (0–10), ATS keywords, Impact statements, Verb strength, Frontend-specific suggestions
  - Re-generate button (in case user updated their CV text)
  - No persistence needed — feedback is ephemeral (regenerate on demand)
- Non-functional:
  - Uses `cheap` tier LLM model (DeepSeek Chat; upgrade to smart/anthropic later if feedback quality needs improvement)
  - Response streamed via Vercel AI SDK `streamText` for perceived speed
  - Feedback NOT stored in DB or AICall logs (ephemeral, privacy)

## Architecture

```
src/app/(app)/cv-review/
  ├─ page.tsx                  ← Server component: loads user.cvData, renders shell
  └─ loading.tsx               ← Skeleton

src/features/cv-review/
  ├─ cv-review-panel.tsx       ← 'use client' — trigger generate, render sections
  └─ cv-review-types.ts        ← CvReview interface

src/app/api/cv/review/route.ts ← POST — streams structured feedback

src/lib/ai/prompts/
  └─ cv-review-prompt.ts       ← buildCvReviewPrompt(cvData: CvData, rawText?: string)
```

### CvReview Response Shape

```ts
interface CvReview {
  overallScore: number;           // 0-10
  atsSummary: string;             // 2-3 sentences on ATS compatibility
  atsKeywordsToAdd: string[];     // up to 8 specific terms
  impactFeedback: string;         // feedback on quantification of achievements
  verbFeedback: string;           // weak verbs found + stronger alternatives
  frontendSuggestions: string[];  // 3-6 frontend-specific bullets
  topStrengths: string[];         // 2-3 things done well
}
```

### Review Prompt

```
System: You are a senior engineering recruiter reviewing a frontend engineer's CV.
        Provide structured, actionable feedback. Return ONLY valid JSON — no markdown.
        Schema: { overallScore (0-10), atsSummary, atsKeywordsToAdd[], impactFeedback,
                  verbFeedback, frontendSuggestions[], topStrengths[] }
        Focus on frontend engineering roles. Be direct and specific.

User: CV data:
      Roles: [{...}]
      Skills: [...]
      Projects: [{...}]
      [If raw text available]: Full CV text: {rawText, truncated to 6000 chars}
```

## Related Code Files

- Create: `src/app/(app)/cv-review/page.tsx`
- Create: `src/app/(app)/cv-review/loading.tsx`
- Create: `src/features/cv-review/cv-review-panel.tsx`
- Create: `src/features/cv-review/cv-review-types.ts`
- Create: `src/app/api/cv/review/route.ts`
- Create: `src/lib/ai/prompts/cv-review-prompt.ts`
- Modify: `src/app/(app)/settings/page.tsx` — add "Review my CV" link button
- Modify: `src/features/app/app-sidebar.tsx` — optionally add CV Review nav item

## Implementation Steps

1. **`cv-review-prompt.ts`** — `buildCvReviewPrompt(cvData, rawText?)`:
   - Format `cvData` as readable text (same format as `buildCvContext` but fuller)
   - Append raw text if available (truncated to 6000 chars)
   - Return `{ system, user }`

2. **`src/app/api/cv/review/route.ts`** — POST handler:
   - Authenticate with `requireUser()`
   - Require `user.cvData` to be non-null (400 if missing)
   - Build prompt, call `generateObject` (not stream — structured JSON easier to validate)
   - Validate with `cvReviewSchema` (Zod)
   - Return `{ ok: true, review: CvReview }`
   - **Do not** log CV content

3. **`cv-review-types.ts`** — `CvReview` interface + `cvReviewSchema` Zod

4. **`cv-review-panel.tsx`** — client component:
   - "Generate Review" button → POST `/api/cv/review` → loading state
   - Render feedback in sections:
     - **Score badge** (large, coloured 0–10)
     - **Top Strengths** (green chips)
     - **ATS** (keywords to add as pills + prose)
     - **Impact** (prose paragraph)
     - **Verbs** (prose with before/after examples)
     - **Frontend Suggestions** (bulleted list)
   - "Re-generate" button after first generation

5. **`cv-review/page.tsx`** — server component:
   - Load user, check `cvData` exists (redirect to `/settings` with message if not)
   - Render `<CvReviewPanel cvData={user.cvData} />`

6. **Settings page** — add "Review my CV →" link button below the CV upload card
   (only when `user.cvData` is non-null)

## Success Criteria

- [ ] Page only accessible when `cvData` exists; settings shows link only when CV parsed
- [ ] "Generate Review" → structured feedback rendered in ≤15 s
- [ ] All 6 sections (score, ATS, impact, verbs, frontend, strengths) render correctly
- [ ] Re-generate produces fresh output
- [ ] No CV content in AICall table after review

## Risk Assessment

- **LLM JSON reliability**: same mitigation as Phase 2 (strip fences, Zod validate, fallback).
- **Latency**: `generateObject` may take 5–12 s. Show a progress indicator with steps
  ("Analysing roles…", "Checking ATS keywords…") while the request is in flight — fake
  progress but realistic enough to feel responsive.
