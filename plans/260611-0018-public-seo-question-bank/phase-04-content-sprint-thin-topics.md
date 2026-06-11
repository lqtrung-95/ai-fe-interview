# Phase 04 — Content Sprint: Thin Topics + Polish

## Context Links

- Plan: [plan.md](plan.md) | Independent of phases 1–3 (run in parallel; reseed after phase-01 merges)
- Format spec: `docs/question-generation-rules.md` (MUST conform; updated w/ slug rule in phase-01)
- Pipeline: `pnpm generate:questions`, `pnpm generate:diagrams-new`, `pnpm enrich:system-design`, `pnpm seed`
- Current counts: JS ~19, Behavioral ~8, Testing ~25, Perf ~32, Browser ~44, React ~62, FSD ~80

## Overview

- Priority: medium (multiplies phase 2–3 value: every question = an indexed page)
- Status: ✅ done (2026-06-11)
- Curation-heavy, code-light. Targets: **JavaScript ≥ 50, Behavioral ≥ 30**, polish pass on
  existing questions missing ELI5/diagram/quiz.

## Key Insights

- This is owner-as-reviewer work: pipeline generates, human curates. Budget review time,
  not engineering time.
- Phase-03 sitemap excludes questions w/o childExplanation — polish pass directly grows
  the indexable page set.
- Behavioral questions need different rubric emphasis (communication/structure vs technical
  correctness) — verify generation prompt handles type=behavioral properly before batch run.

## Requirements

- Functional: new questions pass schema validation, have ELI5 + expectedPoints + rubric;
  senior-level JS topics covered (closures→event loop→memory→iterators→proto→async patterns).
- Non-functional: zero regressions on existing question ids/slugs after reseed.

## Related Code Files

- Modify: `prisma/seed/questions/javascript.json`, `behavioral.json` (additions)
- Possibly modify: `scripts/generate-new-questions.ts` (topic/type targeting flags if missing)
- No app code changes expected

## Implementation Steps

1. Gap analysis: list senior JS subtopics absent from current 19 (compare against
   `resources/` handbooks ToC); same for behavioral (conflict, leadership, failure,
   cross-team, estimation stories).
2. Batch-generate JS candidates (~40) via `generate:questions`; human review pass:
   reject/edit to ≥ 31 accepted (reach 50 total). Quality bar: would a real senior
   interviewer ask this; is the rubric discriminating.
3. Same for behavioral (~30 candidates → ≥ 22 accepted, reach 30).
4. Run `generate:diagrams-new` for accepted technical questions; spot-check SVG rendering.
5. Polish pass: query existing rows missing childExplanation/diagram/quiz
   (`psql` count per topic); fill top-priority ones (most central interview topics first).
6. Reseed dev → verify idempotency (no slug/id churn) → seed prod → confirm
   `revalidateTag('seed-questions')` path (re-run seed triggers it or call manually).
7. Spot-check 10 new public pages render correctly (post phase-02/03 merge).

## Todo List

- [x] JS gap list + Behavioral gap list (specs: `scripts/question-specs-javascript-core-gaps.ts`, `question-specs-behavioral-stories.ts`)
- [x] JS: 27 generated → 51 total (≥50 ✓)
- [x] Behavioral: 21 generated via new behavioral prompt variant → 30 total (≥30 ✓)
- [x] Diagrams: 43 generated (27 new JS + 15 React backlog + 1 regen), 0 failures; behavioral excluded by design
- [x] Polish pass: 8 hand-written behavioral rows enriched (ELI5+notes+quiz) — all noindex thin pages eliminated; `font-loading-strategy` regenerated (was missing ladder/pitfall); 2 broken quizzes fixed
- [x] Backfill (48 slugs) + double reseed verified: 338 rows, 0 churn, 0 null slugs
- [ ] 10-page public spot-check (after deploy)

**Notes:** generation prompt did NOT handle type=behavioral — added `behavioral-content-prompt.ts`
(STAR structure, interviewer-probe ladder, judgment quiz, no code blocks) + docs §9.6.
Format validator added: `scripts/validate-question-content-format.ts` (all 98 new-prep rows pass;
2 pre-existing live rows with 1 code block accepted as legacy).

## Success Criteria

- Counts: JS ≥ 50, Behavioral ≥ 30; all pass question-generation-rules format.
- Sitemap entry count grows accordingly; no existing URL broken.

## Risk Assessment

- AI slop risk: generation without strict review erodes the product's core promise —
  the human-review gate is non-negotiable; reject ratio is expected and fine.
- Behavioral rubric mismatch → adjust generation prompt before the batch, not after.

## Security Considerations

- None beyond standard: no PII in question content; seed scripts run with dev/prod env
  separation already in place.

## Next Steps

- After ship + 2-week checkpoint (GSC indexing, analytics), scope queued cycle B:
  voice-led AI interviewer (see brainstorm report).
