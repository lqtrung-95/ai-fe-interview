# Phase 03 — SEO Plumbing: Sitemap, OG, Metadata, Analytics Events

## Context Links

- Plan: [plan.md](plan.md) | Depends on: phase-02
- OG pattern to copy: `src/app/api/og/session/route.tsx`
- Slug list service: `listAllQuestionSlugs()` from phase-01
- Analytics: `@vercel/analytics` already mounted in `src/app/layout.tsx`

## Overview

- Priority: high
- Status: ✅ done (2026-06-11)
- Make the new pages discoverable and measurable: per-page metadata, sitemap, robots,
  OG images, canonical URLs, CTA conversion events.

## Key Insights

- No `sitemap.ts` / `robots.ts` exist yet — net-new, Next App Router file conventions.
- `/api/og/session` shows the established OG image pattern (ImageResponse) — copy, don't invent.
- Site URL must come from one env-derived constant for canonical/sitemap/OG consistency.

## Requirements

- Functional: every question detail page has unique title/description/canonical/OG image;
  sitemap covers static pages + handbooks + all question slugs; robots allows all + sitemap ref.
- Non-functional: sitemap generation uses cached slug list (no per-request DB scan storm).

## Related Code Files

- Create: `src/lib/seo/site-url.ts` — single source for absolute base URL
- Create: `src/app/sitemap.ts` — static routes + resources + `/questions` + all slugs
- Create: `src/app/robots.ts`
- Create: `src/app/api/og/question/route.tsx` — topic-badged question card image
- Modify: `src/app/(reader)/questions/[slug]/page.tsx` — `generateMetadata` (title =
  question truncated ~60 chars; description = childExplanation excerpt ~155 chars;
  canonical; openGraph/twitter w/ OG image URL)
- Modify: `src/app/(reader)/questions/page.tsx` — hub metadata
- Modify: gated teaser + practice CTA components — `track('question_cta_click', { slug, cta })`

## Implementation Steps

1. `site-url.ts`: `NEXT_PUBLIC_SITE_URL` env with vercel-url fallback; document in README env table.
2. `sitemap.ts`: merge static entries (marketing, /demo, /resources/*, /questions) +
   `listAllQuestionSlugs()` → `/questions/{slug}` entries (lastModified = updatedAt if cheap).
3. `robots.ts`: allow `/`, disallow `/api/`, `/dashboard`, app-only routes; `sitemap:` ref.
4. OG route: copy session OG structure; render topic badge, difficulty, truncated question,
   brand mark. Reference from `generateMetadata`.
5. `generateMetadata` on detail + hub; strip markdown/HTML from excerpt source.
6. Wire `track()` events on the 3 teaser CTAs + signed-in deep link.
7. Verify: `curl` page source for meta tags; `pnpm build`; fetch `/sitemap.xml` + `/robots.txt`
   locally; OG image renders for 3 sample slugs.
8. Post-deploy (manual, document in README or report): submit sitemap in Google Search Console.

## Todo List

- [x] site-url util — reuses existing `NEXT_PUBLIC_APP_URL` (already in README env table)
  instead of a new `NEXT_PUBLIC_SITE_URL`; Vercel prod-domain fallback
- [x] sitemap.ts — 13 static routes (incl. cheatsheets) + 278 indexable question slugs
  (thin questions excluded); try/catch fallback so a DB blip can't fail the build
- [x] robots.ts — app surfaces disallowed, sitemap referenced
- [x] OG question image route (`/api/og/question?slug=`), display fields only, length-capped
- [x] generateMetadata detail + hub (canonical, OG/twitter image; thin pages get
  `noindex,follow` until content sprint fills them)
- [x] CTA analytics events — `question_cta_click` w/ `{ slug, cta }` on 3 teasers + deep link
- [x] Local verification pass: meta/canonical/og verified via curl; sitemap 291 URLs;
  robots.txt correct; OG renders image/png for 3 sample slugs
- [ ] Post-deploy (manual): submit sitemap in Google Search Console

## Success Criteria

- `view-source` of a detail page shows unique title, description, canonical, og:image.
- `/sitemap.xml` lists every slug; validates in GSC without errors.
- CTA clicks appear in Vercel Analytics custom events.

## Risk Assessment

- Thin-content flag: pages w/o childExplanation or diagram look empty → sitemap should
  EXCLUDE slugs missing childExplanation; Phase-04 polish fills the gaps.
- Wrong canonical (preview deployments) → canonical always uses site-url constant, not request host.

## Security Considerations

- OG route is public/unauthenticated by design; it must query only display fields by slug
  and cap rendered text length (no injection of raw HTML into ImageResponse).

## Next Steps

Phase 4 content sprint raises page count + quality; reseed triggers `revalidateTag('seed-questions')`.
