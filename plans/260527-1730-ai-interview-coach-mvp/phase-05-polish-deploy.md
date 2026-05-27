# Phase 05 — Polish & Deploy

## Context Links

- [PRD §11 Non-functional](../../PRD.md), [§12 UX](../../PRD.md), [§19 Edge Cases](../../PRD.md), [§20 Analytics](../../PRD.md), [§25 Portfolio](../../PRD.md), [§26 Definition of Done](../../PRD.md)
- [System Architecture §10 Security](../../docs/system-architecture.md#10-security), [§11 Observability](../../docs/system-architecture.md#11-observability--cost), [§12 Performance](../../docs/system-architecture.md#12-performance-targets-prd-§111)

## Overview

- **Priority:** P0 (ship blocker)
- **Status:** pending
- Tighten the bolts: responsive QA, error boundaries, rate-limit validation, PostHog wiring, Vercel deployment, demo seed data, portfolio writeup.

## Key Insights

- Polish phase is where the difference between "demo" and "product" emerges. Don't skip the empty/error/loading states.
- Demo data is critical for the portfolio play — anyone landing on the deployed site should see meaningful UI immediately, even unauthenticated.
- Vercel free tier has a 10s function timeout — confirm streaming endpoints stay under it (they should; AI SDK closes properly).
- PostHog client init order matters — must initialize before any event capture or events drop silently.

## Requirements

**Functional**
- All PRD §20 events fire from correct touchpoints (homepage_viewed, session_created, answer_submitted, feedback_generated, etc.).
- Every async UI surface has loading + error + empty states.
- Rate limit returns 429 with retry-after header; UI shows friendly message.
- Error boundaries catch render errors at route level.
- Public demo session viewable without auth (read-only).
- App deployed to Vercel; custom domain optional.

**Non-functional**
- Landing LCP < 1.5s (PRD §11.1).
- Dashboard load < 2s.
- Lighthouse score ≥ 90 across categories on landing.
- All keyboard-navigable; visible focus states (PRD §11.5).

## Architecture

- Error boundary per route group in `app/(app)/error.tsx` + `app/(marketing)/error.tsx`.
- Global PostHog provider wraps `RootLayout`.
- Server-side event capture for AI calls via `posthog-server.ts`.
- Demo session: hardcoded `SeedSession` JSON loaded on `/demo` route, no DB write.

## Related Code Files

**Create**
- `src/app/(marketing)/demo/page.tsx` — read-only demo session walkthrough
- `src/app/error.tsx` — global error boundary
- `src/app/(app)/error.tsx` — app-shell error boundary
- `src/app/not-found.tsx`
- `src/lib/analytics/posthog-server.ts`
- `src/lib/analytics/posthog-client.ts`
- `src/lib/analytics/events.ts` — typed event helpers
- `src/components/analytics/posthog-provider.tsx`
- `src/components/common/loading-state.tsx`
- `src/components/common/error-state.tsx`
- `src/components/common/empty-state.tsx`
- `src/components/common/rate-limit-banner.tsx`
- `prisma/seed/demo-session.json` — hardcoded demo content
- `README.md` — portfolio writeup per PRD §25
- `.github/workflows/ci.yml` — typecheck + lint on PR
- `vercel.json` — function configs

**Modify**
- `src/middleware.ts` — return 429 with retry-after on rate limit hit
- `src/app/layout.tsx` — wrap with PostHogProvider
- All Route Handlers — add event capture calls
- All async data hooks — wire `loading` and `error` to common components
- `src/app/(marketing)/page.tsx` — add link to `/demo`

## Implementation Steps

1. **Analytics**
   - Install: `posthog-node posthog-js`.
   - Implement client + server PostHog modules.
   - Build `events.ts` exporting typed functions: `trackHomepageViewed()`, `trackSessionCreated({sessionId, mode, topics, difficulty})`, etc.
   - Wire client events in landing, onboarding, topic selection, interview UI.
   - Wire server events in Route Handlers (capture with `userId`).
2. **Error & loading states**
   - Build `LoadingState`, `ErrorState`, `EmptyState`, `RateLimitBanner` shared components.
   - Add `error.tsx` boundaries per route group.
   - Audit every page — ensure no naked `Suspense` without fallback.
   - 429 response → UI shows `RateLimitBanner` with countdown.
3. **Demo session**
   - Hand-write a realistic 3-question session (question, answer, feedback) in `demo-session.json`.
   - Build `/demo` page that renders it using the same `<QuestionPanel>` and `<FeedbackCard>` components.
   - No backend writes; pure client render.
   - Link from homepage "View Demo" CTA (PRD §7.1).
4. **Performance**
   - Run Lighthouse on landing; fix top 3 issues.
   - Lazy-load Recharts in dashboard.
   - Verify font preload + LCP image priority.
   - Verify no client JS on `(marketing)` routes outside hydration islands.
5. **A11y**
   - Run axe-core; fix violations.
   - Verify keyboard nav for full interview flow.
   - Verify focus rings; color contrast.
6. **Deploy**
   - Create Vercel project.
   - Set all env vars from `.env.local.example`.
   - Connect Supabase prod project (separate from local dev).
   - Run prod migration: `prisma migrate deploy`.
   - Seed prod question bank.
   - Set up Supabase webhook pointing to prod URL.
   - Verify OAuth callback URL matches deployed origin.
7. **CI**
   - GitHub Action: `pnpm install --frozen-lockfile && pnpm tsc --noEmit && pnpm lint`.
8. **Portfolio**
   - Write README per PRD §25 — value prop, screenshots, architecture diagram, tech stack, live link.
   - Capture 3-4 screenshots (landing, interview, feedback, dashboard).
9. **Final QA**
   - Run through PRD §26 Definition of Done checklist end-to-end on the deployed URL.
   - Run through PRD §19 edge cases — close browser mid-session, kill network mid-AI, submit empty answer, submit very short answer.

## Todo List

- [ ] PostHog client + server initialized
- [ ] All PRD §20 events fire correctly (verify in PostHog dashboard)
- [ ] Loading/error/empty states present on every async surface
- [ ] Error boundaries catch route-level failures
- [ ] 429 rate limit UX in place
- [ ] Demo session viewable at /demo without auth
- [ ] Lighthouse ≥ 90 across categories on landing
- [ ] Axe-core: zero serious or critical violations
- [ ] Keyboard navigation works end-to-end
- [ ] Vercel project deployed; custom env vars configured
- [ ] Prod Supabase migrated + seeded
- [ ] CI workflow passes on a sample PR
- [ ] README written with screenshots + live link
- [ ] All PRD §19 edge cases handled gracefully
- [ ] PRD §26 Definition of Done — every box checked

## Success Criteria

- A stranger lands on the deployed URL, clicks "View Demo", completes a demo session, understands the value, signs up, runs a real session, sees feedback, views dashboard — all without errors or confusing states.
- Lighthouse landing ≥ 90 all categories.
- All 16 PRD §20 events visible in PostHog with expected properties.
- README is portfolio-ready (clear value prop, architecture summary, live link, screenshots).

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Vercel 10s function timeout kills streaming | Test with longest realistic prompt; AI SDK should close gracefully; fall back to non-streaming for evaluate if needed |
| PostHog event drop on initial page load | Init in `RootLayout` before any client component; use `posthog.capture()` not `posthog.queue()` |
| Supabase webhook fires before User row created | First authenticated Server Component checks/creates User row idempotently |
| Demo session feels stale or generic | Curate from real interview content; vary question/feedback tone |
| Mobile interview UI feels cramped | Test on real iPhone SE width (375px); collapse sidebar to bottom sheet |

## Security Considerations

- Verify no `console.log` of API keys, user emails, or AI responses in production build.
- CSP headers set; rate limit active on all `/api/*`.
- PostHog event properties never contain user-typed answer text.
- Verify `.env.local` not committed; verify Vercel env vars marked sensitive.

## Next Steps

Post-MVP roadmap per PRD §23:
1. Voice practice (OpenAI Realtime API) — slots into orchestrator as 5th task type.
2. Resume-based personalization — `UserDocument` + pgvector.
3. System design canvas — tldraw integration.
4. Company-specific modes.
5. Paid tier per PRD §21.
