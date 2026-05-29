---
title: "Interview Feature Pack: Timer + Review + Spaced Repetition + Voice"
description: "Four user-requested features: styled answer review with follow-up display, per-question countdown timer, Web Speech API voice input, and SM-2 spaced repetition in the study plan."
status: pending
priority: P1
branch: "main"
tags: ["interview", "study-plan", "voice", "timer", "spaced-repetition"]
blockedBy: []
blocks: []
created: "2026-05-29T19:16:54.898Z"
createdBy: "ck:plan"
source: skill
---

# Interview Feature Pack: Timer + Review + Spaced Repetition + Voice

## Overview

Four independent, user-requested features added on top of the completed MVP. Each phase is
self-contained and can ship independently. Recommended order: 1 → 2 → 3 → 4 (increasing DB risk).

## Codebase Context

- Interview state machine: `src/features/interview/interview-store.ts` (Zustand)
- Interview flow hook: `src/features/interview/use-interview-flow.ts`
- Answer textarea: `src/features/interview/components/answer-panel.tsx` (or similar)
- History detail: `src/app/(app)/history/[sessionId]/page.tsx` + `src/features/history/components/session-detail.tsx`
- Study plan actions: `src/features/study-plan/actions/study-plan-actions.ts`
- Study plan progress model: `StudyPlanProgress` in `prisma/schema.prisma`
- TanStack Query keys: `src/lib/query/keys.ts`

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Answer Review Enhancements](./phase-01-answer-review-enhancements.md) | Pending | 2h |
| 2 | [Timed Mock Interview](./phase-02-timed-mock-interview.md) | Pending | 3h |
| 3 | [Voice Answer Input](./phase-03-voice-answer-input.md) | Pending | 2h |
| 4 | [Spaced Repetition Study Plan](./phase-04-spaced-repetition-study-plan.md) | Pending | 4h |

## Dependencies

No cross-plan blocking. Phases 1–3 are pure UI with no schema changes.
Phase 4 requires a Prisma migration and must be run after `prisma migrate deploy`.
