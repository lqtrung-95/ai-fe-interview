---
title: "CV Upload, Parse & Personalized Interview Questions"
description: "Upload a CV/resume, extract structured profile data via LLM, and use it to generate interview questions grounded in the user's real experience (companies, roles, projects, skills)."
status: pending
priority: P1
branch: "main"
tags: ["cv", "personalization", "interview", "settings", "llm"]
blockedBy: []
blocks: []
created: "2026-05-31T05:34:47.551Z"
createdBy: "ck:plan"
source: skill
---

# CV Upload, Parse & Personalized Interview Questions

## Overview

Users upload a PDF résumé (or paste plain text). An LLM extracts structured profile data
(companies, roles, skills, projects, tech stack). That structured data is then injected into
the question-generation prompt so the AI asks questions grounded in the user's actual
experience — e.g. "You migrated X from CSR to SSR at Y — walk me through the trade-offs."
A CV Review page (Phase 4) provides ATS / improvement feedback as a bonus feature.

## Codebase Context

| File | Role |
|------|------|
| `prisma/schema.prisma` | User model — add `cvData`, `cvFileUrl`, `cvParsedAt` |
| `src/lib/auth/supabase-server.ts` | Supabase client (server) — reuse for storage ops |
| `src/features/settings/components/profile-form.tsx` | Avatar upload pattern to mirror for CV |
| `src/app/(app)/settings/page.tsx` | CV upload card added here |
| `src/lib/ai/prompts/question-prompt.ts` | Inject `cvContext` block |
| `src/features/interview/ai-schemas.ts` | Add `cvContext` to `questionInputSchema` |
| `src/features/interview/session-config-schema.ts` | Add `usesCv` flag |
| `src/features/interview/server/question-service.ts` | Pass `cvContext` when flag is set |
| `src/features/interview/topic-selection-form.tsx` | "Based on my CV" toggle |
| `src/app/api/cv/` | New API routes: `parse/route.ts`, `delete/route.ts` |
| `src/lib/cv/` | New: `cv-storage.ts`, `cv-parser.ts`, `cv-types.ts` |

## Data Model — CvData JSON shape

```ts
interface CvData {
  summary?: string;                     // ≤3 sentences from the profile/summary section
  roles: Array<{
    company: string;
    title: string;
    duration?: string;                  // e.g. "2022–2024"
    highlights: string[];               // 2-4 bullet points, tech-focused
  }>;
  skills: string[];                     // e.g. ["React", "TypeScript", "GraphQL"]
  projects: Array<{
    name: string;
    description: string;               // 1-2 sentences
    tech: string[];
  }>;
  education?: string;                  // degree + institution, 1 line
}
```

## Privacy Constraints

- **No CV text in `AICall` logs** — `cvContext` is stripped from `AICall.model` / log fields.
- User can delete their CV (removes file from Supabase Storage + clears DB fields).
- CV file stored in a **private** Supabase Storage bucket (`cvs`) — never public URLs.
- Signed URLs (60 s TTL) used when the API route needs to download the file.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [DB Schema & Storage](./phase-01-db-schema-storage.md) | Pending | 2 h |
| 2 | [CV Upload & LLM Parse](./phase-02-cv-upload-llm-parse.md) | Pending | 4 h |
| 3 | [CV-Grounded Session Mode](./phase-03-cv-grounded-session-mode.md) | Pending | 3 h |
| 4 | [CV Review Page](./phase-04-cv-review-page.md) | Pending | 3 h |

## Out of Scope

- Multi-CV support (one CV per user for now)
- CV version history
- Direct ATS submission / job matching
- Generating a new CV from scratch
