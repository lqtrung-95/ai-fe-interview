---
phase: 3
title: "CV-Grounded Session Mode"
status: pending
priority: P1
effort: "3h"
dependencies: [phase-02-cv-upload-llm-parse]
---

# Phase 3: CV-Grounded Session Mode

## Overview

When the user has a parsed CV, a "Based on my CV" toggle appears in `TopicSelectionForm`.
Enabling it injects a formatted CV context block into the question-generation prompt so the
LLM asks questions grounded in the user's actual companies, roles, projects, and tech stack.

## Requirements

- Functional:
  - Toggle only shown when `user.cvData` is non-null
  - When enabled: `cvContext` (formatted excerpt) passed through the session → question service → LLM prompt
  - Questions reference real experience: "You worked at X on Y — walk me through…"
  - `usesCv` flag stored on `InterviewSession` for history/analytics
  - Topics selection still available (CV mode narrows question style, not topic)
- Non-functional:
  - `cvContext` NOT stored in `AICall` logs (privacy constraint from plan overview)
  - `cvContext` string ≤ 1200 chars (keeps prompt token cost reasonable)
  - Graceful degradation: if `cvData` is null/empty, toggle is hidden, session runs normally

## Architecture

```
Data flow:
  TopicSelectionForm (toggle on)
    → createSession({ …, usesCv: true })
    → create-session-action: reads User.cvData, formats cvContext string
    → InterviewSession.usesCv = true stored in DB
    → question-service: loads session.usesCv + user.cvData → builds cvContext
    → questionInputSchema.cvContext injected
    → buildQuestionPrompt: appends CV context block to user prompt
```

### cvContext Format (≤ 1200 chars)

```
The candidate's background:
- Most recent role: {title} at {company} ({duration})
  Key work: {highlight1}; {highlight2}
- Previous: {title} at {company}
  Key work: {highlight1}
- Skills: {top 8 skills joined by ", "}
- Notable projects: {project.name} ({tech joined by ", "}) — {description}
```

Built by `src/lib/cv/cv-context-builder.ts` → `buildCvContext(cvData: CvData): string`.
Picks top 2 roles (most recent first), top 8 skills, top 2 projects. Hard-truncates at 1200 chars.

### Prompt Injection

In `buildQuestionPrompt` (`src/lib/ai/prompts/question-prompt.ts`):

```ts
const cvBlock = input.cvContext
  ? `\n\nCandidate background (use to personalise the question — probe their real experience):\n${input.cvContext}`
  : '';

// Append cvBlock to the `user` string (after avoidQuestions, before seedBlock)
```

System prompt gets one additional instruction when cvContext is present:
> "When cvContext is provided, tailor the question to probe the candidate's specific
>  companies, projects, or technologies. Prefer 'Walk me through how you…' framing."

## Related Code Files

- Create: `src/lib/cv/cv-context-builder.ts`
- Modify: `src/features/interview/ai-schemas.ts` — add `cvContext?: string` to `questionInputSchema`
- Modify: `src/features/interview/session-config-schema.ts` — add `usesCv?: boolean` to schema
- Modify: `src/features/interview/server/create-session-action.ts` — accept `usesCv`, store on session
- Modify: `src/features/interview/server/question-service.ts` — read `session.usesCv` + `user.cvData`, call `buildCvContext`
- Modify: `src/lib/ai/prompts/question-prompt.ts` — inject `cvBlock`
- Modify: `src/features/interview/topic-selection-form.tsx` — "Based on my CV" toggle
- Modify: `prisma/schema.prisma` — add `usesCv Boolean @default(false)` to `InterviewSession`
- Run: `pnpm db:migrate --name add_uses_cv_to_interview_session`

## Implementation Steps

1. **`cv-context-builder.ts`** — `buildCvContext(cvData: CvData): string`:
   - Pick roles[0..1], skills[0..7], projects[0..1]
   - Format as the template above
   - `return text.slice(0, 1200)` — hard cap

2. **Schema updates**:
   - `prisma/schema.prisma`: `InterviewSession` += `usesCv Boolean @default(false)`
   - `ai-schemas.ts`: `questionInputSchema` += `cvContext: z.string().max(1200).optional()`
   - `session-config-schema.ts`: `createSessionSchema` += `usesCv: z.boolean().optional()`

3. **`create-session-action.ts`**:
   - Accept `usesCv` from form payload
   - Store `usesCv` on the created `InterviewSession`

4. **`question-service.ts`**:
   - When `session.usesCv` is true: load `user.cvData` from DB
   - Call `buildCvContext(cvData)` → pass as `cvContext` in `QuestionInput`
   - **Do not** include raw `cvContext` in `AICall` metadata/logs

5. **`question-prompt.ts`**:
   - Add `cvContext?: string` to `QuestionInput` usage
   - Append `cvBlock` to `user` prompt string
   - Add one system instruction line when `cvContext` is present

6. **`topic-selection-form.tsx`**:
   - Accept `hasCv: boolean` prop (passed from settings/practice page)
   - Add toggle below Topics section: "🎯 Personalise with my CV" (only if `hasCv`)
   - When toggled on, include `usesCv: true` in session creation payload
   - Add hint text: "Questions will reference your real experience at [companies]"

7. **Practice page `page.tsx`**:
   - Load `user.cvData` (already available from `requireUser()` extended query)
   - Pass `hasCv={!!user.cvData}` down to `InterviewShell` → `TopicSelectionForm`

## Success Criteria

- [ ] Toggle hidden when user has no CV
- [ ] Toggle shown when user has `cvData`; session starts with `usesCv: true` in DB
- [ ] First question references user's company/role/tech from CV
- [ ] Questions without CV toggle work identically to before (no regression)
- [ ] `AICall` rows do not contain raw CV text
- [ ] `cvContext` ≤ 1200 chars in all cases

## Risk Assessment

- **LLM ignoring the context**: model might not use CV context if the topic is very
  narrow. Mitigation: system prompt explicitly asks to probe specific experience; acceptable
  if the question is still personalised by tech/domain even when exact company not mentioned.
- **Stale cvData**: user's CV may be outdated. Mitigation: "last parsed" timestamp shown
  in settings; "Re-parse" button available. No automatic staleness expiry needed in v1.
