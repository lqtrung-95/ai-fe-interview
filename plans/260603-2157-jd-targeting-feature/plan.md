# JD Targeting Feature

**Status:** Planning  
**Decision:** Pro-only · max 3 saved JD targets per user

## Overview

Users can save up to 3 Job Descriptions in Settings. When starting a practice session they pick a saved JD target, which auto-labels the session and injects JD context into every question generated during that session.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [DB Schema](phase-01-db-schema.md) | Pending |
| 2 | [JD Extraction AI](phase-02-jd-extraction-ai.md) | Pending |
| 3 | [TargetJob CRUD (API + server actions)](phase-03-target-job-crud.md) | Pending |
| 4 | [Settings UI — TargetJobsCard](phase-04-settings-ui.md) | Pending |
| 5 | [Session creation — schema, action, form](phase-05-session-creation.md) | Pending |
| 6 | [Question generation — inject jdContext](phase-06-question-generation.md) | Pending |
| 7 | [Display — session labels in history](phase-07-display.md) | Pending |
| 8 | [Copy — landing pricing + upgrade wall](phase-08-copy-updates.md) | Pending |

## Key Decisions

- Pro-only; free users see a lock state on the session form
- Max 3 JD targets per user (enforced in server action)
- JD context extracted once at save time (not re-extracted per session)
- Session label auto-set from target job label at session creation
- `TargetJob` is the source of truth; `InterviewSession.targetJobId` is a FK
- No copy of `jdContext` on the session — join to `TargetJob` at question gen time

## New Files

```
src/features/target-jobs/
  target-job-types.ts                   JdContext interface
  server/
    target-job-service.ts               CRUD + extraction orchestration
    extract-jd-action.ts                server action (extract + save)
  components/
    target-jobs-card.tsx                Settings card (Pro-gated)
    target-job-form.tsx                 Add/edit form inside the card
src/lib/ai/prompts/
  jd-extract-prompt.ts                  Prompt builder for JD extraction
src/app/api/target-jobs/
  route.ts                              GET (list) · POST (create) · DELETE ?id=
```

## Modified Files

```
prisma/schema.prisma                    TargetJob model + relations
src/features/interview/ai-schemas.ts    extract_jd task types + jdContext on QuestionInput
src/lib/ai/orchestrator.ts              extract_jd task branch
src/lib/ai/model-router.ts              route extract_jd
src/features/interview/session-config-schema.ts   add targetJobId
src/features/interview/server/create-session-action.ts  label from targetJob
src/features/interview/topic-selection-form.tsx   Target job section
src/features/interview/server/question-service.ts inject jdContext
src/lib/ai/prompts/question-prompt.ts   handle jdContext
src/features/history/components/session-list-item.tsx  show label
src/app/(app)/settings/page.tsx         add TargetJobsCard
src/features/subscription/upgrade-wall-dialog.tsx  update perks
src/features/marketing/landing-pricing.tsx          update pro list
```
