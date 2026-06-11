# Phase 01 — Question Slug Column + Public Data Service

## Context Links

- Plan: [plan.md](plan.md)
- Brainstorm: `plans/reports/brainstorm-260611-0018-public-seo-question-bank-and-content-sprint-report.md`
- Schema: `prisma/schema.prisma` (`model SeedQuestion`)
- Data layer: `src/features/study/server/study-service.ts` (unstable_cache pattern, `seed-questions` tag)

## Overview

- Priority: high (blocks Phase 2)
- Status: ✅ done (2026-06-11)
- Add a stable, unique, human-readable `slug` to `SeedQuestion`; expose slug-based
  cached read functions for the public pages.

## Key Insights

- Slugs must be STABLE: generated once, never recomputed when question text is edited —
  URL permanence beats slug freshness. Backfill sets it; seed upsert must NOT overwrite.
- `study-service.ts` already wraps all reads in `unstable_cache` (1h, tag `seed-questions`) —
  follow that exact pattern for new functions.

## Requirements

- Functional: every SeedQuestion row has a unique kebab-case slug ≤ 80 chars.
- Non-functional: no URL changes after first assignment; reseed runs idempotently.

## Related Code Files

- Modify: `prisma/schema.prisma` — `slug String? @unique` on SeedQuestion
- Create: migration via `pnpm db:migrate dev --name seed_question_slug`
- Create: `scripts/backfill-question-slugs.ts` — slugify + dedupe + write
- Modify: `prisma/seed.ts` — assign slug on create only; never update existing slug
- Modify: `src/features/study/server/study-service.ts` — add `getStudyQuestionBySlug(slug)`,
  `listPublicQuestionSummaries()` (id, slug, topic, difficulty, question, hasDiagram),
  `listAllQuestionSlugs()` (for sitemap); all wrapped in `unstable_cache` w/ CACHE_OPTS
- Modify: `docs/question-generation-rules.md` — document slug field + generation rule

## Implementation Steps

1. Add `slug String? @unique` to SeedQuestion; run migration.
2. Write `scripts/backfill-question-slugs.ts`:
   - slug = kebab-case(question text), strip punctuation, truncate at word boundary ≤ 80 chars
   - collision → append `-2`, `-3`, …
   - skip rows where slug already set
3. Run backfill against dev DB; spot-check uniqueness (`SELECT count(*) vs count(distinct slug)`).
4. Update `prisma/seed.ts` upsert: `create: { ...slug }`, `update: {}` keeps existing slug.
   New questions entering via seed get slug from same slugify util (extract to
   `src/lib/seo/slugify-question.ts`, shared by script + seed).
5. Add the three service functions to `study-service.ts` (keep file <200 lines —
   if it overflows, split public reads into `study-public-service.ts`).
6. `pnpm typecheck` + run seed against dev to verify idempotency.

## Todo List

- [x] Schema + migration (`20260611000000_seed_question_slug`, applied to dev via `prisma db execute` per manual-migration convention)
- [x] Shared slugify util (`src/lib/seo/slugify-question.ts`)
- [x] Backfill script + run + verify uniqueness (290/290 slugged, all distinct)
- [x] seed.ts slug-on-create-only (+ slug reuse across prune/recreate)
- [x] Service functions in new `study-public-service.ts` (file split per <200-line rule); sitemap fn named `listIndexableQuestionSlugs` (filters thin content)
- [x] question-generation-rules.md updated (§2b slug rules)

**Found & fixed during verification:**
- Duplicate id `fe-prep-2-r-requirements-how-would-you-design-an-infini` in
  frontend-system-design.json (two distinct questions, one id) — second question re-ided.
- Row missing `sourceFile` in browser-and-web-apis.json caused seed prune to run
  unfiltered (`where: { sourceFile: undefined }`) — silently deleting/recreating all rows
  every seed run. Field restored + guard added in seed.ts.

## Success Criteria

- 100% rows slugged, unique; re-running seed changes zero existing slugs.
- `getStudyQuestionBySlug` returns full detail incl. childExplanation/diagramSvg.

## Risk Assessment

- Slug collisions on similar questions → dedupe suffix handles; verify count query.
- Question text edits creating dead expectation of slug change → documented as intentional.

## Security Considerations

- Public service functions must select only display fields — exclude rubric/expectedPoints
  (interviewer answer key should not ship to anonymous HTML).

## Next Steps

Phase 2 consumes `getStudyQuestionBySlug` + `listPublicQuestionSummaries`.
