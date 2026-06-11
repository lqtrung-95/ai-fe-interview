---
title: Public SEO Question Bank + Content Sprint
status: in-progress (phases 1–3 done, phase 4 pending)
created: 2026-06-11
updated: 2026-06-11
source: plans/reports/brainstorm-260611-0018-public-seo-question-bank-and-content-sprint-report.md
---

# Public SEO Question Bank + Content Sprint

Make the ~250+ question bank publicly indexable to create an organic acquisition channel,
while filling thin topics (JS ~19, Behavioral ~8) via the existing generation pipeline.

**Free preview (user decision):** question + ELI5 + diagram. **Gated:** quiz, detailed notes,
bookmarks, AI practice.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Slug foundation (DB + service)](phase-01-question-slug-column-and-service.md) | ✅ done | ~0.5d |
| 2 | [Public question pages + gating](phase-02-public-question-pages-with-gating.md) | ✅ done | ~2d |
| 3 | [SEO plumbing (sitemap, OG, metadata, links)](phase-03-seo-sitemap-og-metadata-internal-links.md) | ✅ done | ~1.5d |
| 4 | [Content sprint (JS, Behavioral, polish)](phase-04-content-sprint-thin-topics.md) | ✅ done | curation hrs |

## Implementation Notes (2026-06-11)

- Phases 1–3 implemented + code-reviewed (all acceptance criteria pass, Lighthouse SEO 100).
- Bonus fixes found during phase 1 verification: duplicate question id in
  frontend-system-design.json; a row missing `sourceFile` in browser-and-web-apis.json
  which made seed.ts's prune **delete and recreate the whole table on every run**
  (Prisma treats `where: { sourceFile: undefined }` as unfiltered) — guarded now.
- Deviations: `listIndexableQuestionSlugs()` (not `listAllQuestionSlugs`) — bakes in the
  thin-content filter; reused `NEXT_PUBLIC_APP_URL` instead of new `NEXT_PUBLIC_SITE_URL` (DRY).
- Known limitation: unknown slug → streamed 200 + noindex (Next 16 streaming metadata),
  not a hard 404. Thin pages (no ELI5) get `robots: noindex,follow` until phase 4 fills them.
- Post-deploy manual step: submit `/sitemap.xml` in Google Search Console.

## Dependencies

- Phase 2 depends on Phase 1 (slugs must exist before routes).
- Phase 3 depends on Phase 2 (sitemap/OG reference live routes).
- Phase 4 independent — can run in parallel with 1–3; reseed last (slugs auto-assigned).

## Key Decisions (from brainstorm)

- Routes live in public `(reader)` group: `/questions` hub + `/questions/[slug]`.
- Slug: new nullable unique column, backfilled from question text, stable once set
  (never regenerated on question edits — URL permanence beats slug freshness).
- `/questions` hub: single page grouped by topic, no pagination v1 (KISS).
- Voice-led AI interviewer = queued NEXT cycle, out of scope here.

## Success Criteria

- All `/questions/*` pages indexed in GSC within 4 weeks of ship.
- Organic landings tracked in Vercel Analytics; CTA clicks instrumented.
- JS ≥ 50, Behavioral ≥ 30 questions merged, conforming to question-generation-rules.md.
