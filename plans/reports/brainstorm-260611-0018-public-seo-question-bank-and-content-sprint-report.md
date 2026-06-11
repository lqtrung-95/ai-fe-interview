# Brainstorm: Next Investment — Public SEO Question Bank + Content Sprint

Date: 2026-06-11 | Status: agreed | Participants: user + brainstormer

## Problem Statement

"Which features to add next vs more quality questions?" Usage = mostly owner + friends; goals = growth + revenue + portfolio + own prep (all four). Bottleneck analysis: zero organic acquisition → revenue/retention features premature. Content quality serves all four goals; needs a distribution surface.

## Current State (scouted)

- 8 feature cycles shipped since 2026-05-27; ~1 feature/week velocity
- Question bank ~250+ behind auth wall (Google can't index): FSD ~80, React ~62, Browser ~44, Perf ~32, Testing ~25, **JS ~19, Behavioral ~8** (thin)
- Question pipeline semi-automated: `generate:questions`, `generate:diagrams-new`, enrichment scripts + strict format spec (`docs/question-generation-rules.md`)
- Public surfaces today: marketing page, `/demo`, `(reader)` handbooks/glossary/cheatsheets
- Monetization wired (Polar; Free 1 session/day vs Pro); Vercel Analytics installed

## Evaluated Approaches

| | Approach | Verdict |
|---|---|---|
| A | **Public SEO question pages + content sprint** | ✅ chosen — only option advancing all 4 goals; compounds (every new question = new indexed page) |
| B | Voice-led conversational AI interviewer (TTS + turn-taking) | ⏭ queued next cycle — strong differentiator + portfolio demo, but deepens product for users that don't exist yet; 2–4 wks |
| C | Retention pack (streaks, email nudges, digests) | ❌ premature — nobody to retain; revisit when analytics shows churning signups |

## Agreed Solution (A, two tracks)

### Track 1 — Feature: public question pages (~1–1.5 wks)
- Routes in public `(reader)` group: `/questions` index (topic filter, lightweight) + `/questions/[slug]` detail
- **Free preview (user decision): question + ELI5 explanation + diagram.** Gated behind sign-up: quiz, detailed notes, bookmarks, "Practice this question" AI flow
- Server-rendered + cached (reuse `study-service` unstable_cache, 1h, `seed-questions` tag)
- SEO plumbing: `generateMetadata` per question, sitemap route, canonical URLs, OG images (reuse `/api/og` infra), internal links from handbooks/glossary → question pages
- Signed-in users hitting public page get link into app question-bank detail

### Track 2 — Content sprint (curation hours, near-zero engineering)
- JavaScript ~19 → 50+; Behavioral ~8 → 30+ via existing pipeline + human review pass (owner = senior FE reviewer)
- Polish pass on top questions: diagrams + quizzes coverage
- Expand coding-challenge set incrementally
- All conform to `question-generation-rules.md`

### Queued — B sketch (next cycle, not this one)
Voice-led mock interview: AI interviewer speaks (TTS), user answers by voice (input already shipped), conversational follow-ups. Scope properly after A ships; candidates: Vercel AI SDK 6 + TTS provider. Differentiator vs static-content competitors (GreatFrontEnd/BigFrontEnd).

## Success Metrics

- Google Search Console: indexed `/questions/*` pages (target: all within 4 wks of ship)
- Vercel Analytics: organic landings on question pages /wk (trend, checkpoint at 2 wks + 6 wks)
- Question-page → sign-up conversion rate (CTA clicks)
- Content: JS ≥50, Behavioral ≥30 questions merged

## Risks

- SEO latency: weeks–months to rank — set expectation, measure indexing not ranking early
- Thin-content penalty: ensure each page has unique ELI5 + diagram (already per-question data) — no boilerplate-only pages
- Duplicate content vs handbooks: link, don't repeat; canonical on question pages
- Cannibalization of gated app bank: minor — public page is the funnel INTO it

## Unresolved Questions

1. Slug strategy: derive from question id vs human-readable slug field (needs new column or computed) — decide in plan
2. Whether `/questions` index paginates or lists all ~300 (payload size) — decide in plan
3. Behavioral target (30) sufficient? Revisit after sprint
