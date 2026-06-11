# Phase 02 — Public Question Pages with Gating

## Context Links

- Plan: [plan.md](plan.md) | Depends on: phase-01
- Public layout pattern: `src/app/(reader)/layout.tsx` (optional auth, ReaderHeader)
- Reusable cards: `src/features/study/components/` — `eli5-card.tsx`, `study-diagram.tsx`,
  `quiz-card.tsx`, `study-question-card.tsx`
- Gated app detail page (reference): `src/app/(app)/question-bank/[id]/page.tsx`

## Overview

- Priority: high
- Status: ✅ done (2026-06-11)
- Two public routes in `(reader)`: `/questions` hub + `/questions/[slug]` detail.
  Free: question, ELI5, diagram. Gated: quiz, detailed notes, bookmarks, AI practice.

## Key Insights

- `(reader)` layout already handles guest vs signed-in header — zero auth work for the shell.
- Pages render dynamic (layout reads cookies) but DB layer is cached 1h — fast enough;
  crawler still receives full SSR HTML. Do NOT chase static rendering this cycle.
- Signed-in users should be deep-linked to the richer app page (`/question-bank/[id]`)
  rather than duplicating the full experience publicly.

## Requirements

- Functional: hub lists all questions grouped by topic w/ topic filter; detail shows free
  preview + locked teasers; 404 for unknown slug; signed-in banner links into app detail.
- Non-functional: detail page LCP content fully server-rendered (no client fetch for
  free content); files < 200 lines (split components per concern).

## Architecture

```
(reader)/questions/page.tsx          — hub: listPublicQuestionSummaries(), group by topic
(reader)/questions/[slug]/page.tsx   — detail: getStudyQuestionBySlug()
features/study/components/public/
  public-question-hub-list.tsx       — topic sections + filter (searchParams, useTransition)
  public-question-detail.tsx         — free content composition (reuse eli5/diagram cards)
  gated-section-teaser.tsx           — lock card: blurred placeholder + sign-up CTA
  signed-in-deep-link-banner.tsx     — "Open in your question bank →" when user present
```

## Related Code Files

- Create: the 2 routes + 4 components above
- Modify: `src/features/app/reader-header.tsx` — add "Questions" nav link
- Modify: `src/app/(reader)/resources/page.tsx` — cross-link to /questions hub

## Implementation Steps

1. Hub page: server component; `listPublicQuestionSummaries()`; group by topic; optional
   `?topic=` filter (same searchParams pattern as app question-bank); per-question link
   uses slug. Counts per topic in section headers.
2. Detail page: fetch by slug, `notFound()` on miss. Render: breadcrumb, topic/difficulty
   badges, question, ELI5 (`eli5-card`), diagram (`study-diagram`). NEVER pass
   rubric/expectedPoints into this tree (phase-01 service already excludes).
3. `gated-section-teaser` ×3 below free content: "Interactive quiz", "Detailed notes",
   "Practice with AI feedback" — each a locked card with benefits line + `Sign up free` CTA
   (`/sign-in?next=/questions/[slug]`). Verify sign-in flow honors `next` param; add if missing.
4. Related questions block: 4–6 same-topic questions (internal link mesh for SEO).
5. Signed-in variant: `getCurrentUser()` in page → show deep-link banner; CTA buttons
   swap to direct app links.
6. Loading: add `loading.tsx` for both routes (skeletons, existing patterns).
7. `pnpm typecheck && pnpm lint && pnpm build`.

## Todo List

- [x] Hub route + topic grouping/filter (filter = crawlable `?topic=` links, not client transition)
- [x] Detail route w/ free preview composition
- [x] Gated teaser component (sign-in `next` redirect already supported end-to-end — verified through sign-in-form → /auth/callback)
- [x] Related-questions internal links (6 same-topic)
- [x] Signed-in deep-link banner
- [x] ReaderHeader + resources cross-links
- [x] loading.tsx for hub; `[slug]/loading.tsx` intentionally omitted (Suspense
  boundary turned unknown slugs into streamed soft-404s); build green
- Verified: no rubric/expectedPoints/followUps in public HTML (view-source grep = 0);
  Lighthouse SEO 100 / A11y 96 on sample detail page

## Success Criteria

- Anonymous user sees question/ELI5/diagram with no auth; quiz/notes locked.
- Signed-in user one click from app detail page.
- Lighthouse SEO score ≥ 95 on a sample detail page.

## Risk Assessment

- ~300-row hub payload: text-only summaries, acceptable; revisit pagination only if slow.
- Duplicate content vs app detail page: app page is behind auth (not indexed) — no conflict.

## Security Considerations

- Confirm no rubric/expectedPoints/followUps leak into public HTML (view-source check).
- Gating is presentational, not security: quiz/notes data simply not fetched for guests.

## Next Steps

Phase 3 adds metadata/sitemap/OG on top of these routes.
