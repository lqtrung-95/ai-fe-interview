---
title: "Resources Section: FE System Design Handbook"
description: "Add /resources section to the app. Phase 1 translates fe-review-handbook.html (38 sections, 51 quizzes, 39 flashcards) into structured JSON. Phases 2–4 build the React UI with the existing Tailwind/shadcn dark theme."
status: pending
priority: P2
branch: "main"
tags: ["resources", "content", "handbook"]
blockedBy: []
blocks: []
created: "2026-05-30T15:49:02.401Z"
createdBy: "ck:plan"
source: skill
---

# Resources Section: FE System Design Handbook

## Overview

Add a `/resources` route group to the app. First guide: a translated, redesigned version of
`resources/fe-review-handbook.html` — 38 sections of Frontend System Design content with
51 inline quizzes and 39 flashcards.

Content is extracted and translated **once by a script**, stored as static JSON, and
rendered at runtime with zero LLM calls. `fe-self-prep.html` is out of scope (content
already in question bank).

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Translation Script](./phase-01-translation-script.md) | Pending | 3h |
| 2 | [Data Types & Schema](./phase-02-data-types-schema.md) | Pending | 1h |
| 3 | [UI Components](./phase-03-ui-components.md) | Pending | 4h |
| 4 | [Routes & Pages](./phase-04-routes-pages.md) | Pending | 2h |
| 5 | [Build Verification](./phase-05-build-verification.md) | Pending | 30m |

## Key Constraints

- Translation via existing `translateToEnglish()` from `scripts/extract-seed-llm-helpers.ts`
- Output stored in `src/data/resources/frontend-system-design.json` (static, committed)
- No runtime LLM calls — translation is a one-time offline script
- Routes under `src/app/(app)/resources/` (authenticated, uses AppSidebar)
- SVG diagrams rendered as-is via `dangerouslySetInnerHTML` (already established pattern)
- QuizCard component already exists — extend or reuse
- No i18n — English only

## Dependencies

- None (self-contained; no blockedBy)
