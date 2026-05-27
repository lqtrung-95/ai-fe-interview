# Plan: AI Interview Coach — MVP

**Created:** 2026-05-27
**Owner:** trungle030195@gmail.com
**Architecture:** [docs/system-architecture.md](../../docs/system-architecture.md)
**PRD:** [PRD.md](../../PRD.md)

## Goal

Ship a text-based AI interview coach for senior frontend engineers — realistic mock interviews, rubric-grounded feedback, progress dashboard. Voice and resume personalization are post-MVP.

## Content sourcing

Seed bank extracted from existing user-authored prep in `resources/` (4 HTML files: VN-language FE/system-design guides + EN Web3 prep). One-off extraction script translates VN→EN, normalizes to `SeedQuestion` JSON, commits output to `prisma/seed/questions/`. No bilingual support in MVP — EN-only product.

## Stack (locked)

Next.js **16** · React **19.2** · TypeScript · Tailwind v4 · shadcn/ui · Zustand · Prisma **7** (pg driver adapter) · Supabase (Auth + Postgres) · Vercel AI SDK v6 · Groq (default) · OpenAI + Anthropic · Upstash Redis · Vercel.

## Phases

| # | Phase | Status | Maps to PRD |
|---|---|---|---|
| 01 | [Foundation](./phase-01-foundation.md) — Next.js + Supabase + Prisma + landing + topic selection + seed bank | **🟡 mostly done — seed extraction blocked on LLM quota** | §16 M1 |
| 02 | [Interview Flow](./phase-02-interview-flow.md) — Session state machine + AI orchestrator + streaming question/feedback | **🟡 partial — question gen + answer submit done; streaming + follow-up still pending** | §16 M2 |
| 03 | [Feedback & Summary](./phase-03-feedback-summary.md) — Scoring + better-answer + session summary + history | pending | §16 M3 |
| 04 | [Dashboard](./phase-04-dashboard.md) — Progress overview + topic radar + recommendations | pending | §16 M4 |
| 05 | [Polish & Deploy](./phase-05-polish-deploy.md) — Responsive + rate limit + error handling + analytics + Vercel | pending | §16 M5 |

## Resume here — snapshot 2026-05-27 19:30 SGT

**What works end-to-end (compiles + serves on `PORT=3001 pnpm dev`):**
- Landing · sign-in (magic link + Google OAuth) · onboarding · topic selection
- Create session · generate question (hybrid 70% seed / 30% AI) · submit answer · advance to next
- Auth-gated `(app)` layout, sidebar, sign-out, resumable sessions
- AI orchestrator with Zod-validated I/O, 1 retry, cost telemetry (`AICall` table)
- Rate limiter (falls open in dev if Upstash unset)
- Per-tier provider routing: `LLM_CHEAP_PROVIDER` + `LLM_SMART_PROVIDER` env vars (default Groq)

**Blockers to actually USE the app:**
1. Seed bank empty — extraction hit Groq daily TPD. 25 cached questions waiting in `scripts/.translation-cache.json`. Wait for quota reset OR set `LLM_SMART_PROVIDER=openai` in `.env.local` and re-run `pnpm extract-seed && pnpm seed`.
2. Flow shows "session complete" after final answer — feedback generation (Phase 03) not built.

**Next concrete steps (priority order):**
1. Finish seed extraction (blocked on LLM quota).
2. Phase 02 remainder: switch question/answer routes to SSE streaming, wire follow-up prompt into flow, build Zustand state machine if needed for richer UX.
3. Phase 03: `evaluate_answer` route + FeedbackCard component + session-complete + summary.
4. Phase 04: dashboard.
5. Phase 05: polish + deploy.

**Gotchas — don't relearn these:**
- Next.js 16: middleware is `proxy.ts` (we use it); `cookies()`/`headers()`/`params`/`searchParams` are async.
- Prisma 7: no `url`/`directUrl` in schema — lives in `prisma.config.ts`. Runtime uses `@prisma/adapter-pg`.
- Supabase IPv4: must use **Session Pooler** URL (port 5432, `aws-X-region.pooler.supabase.com`), not direct.
- Prisma + Supabase pooler: needs `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1` or migrations time out.
- shadcn Button uses Base UI primitive — no `asChild`; use `buttonVariants()` className on `<Link>`.
- Port 3000 collides with another local dev server here — use `PORT=3001 pnpm dev`.
- Avoid `*/` inside JSDoc — breaks the comment block (saw this in `lib/rate-limit/upstash.ts`).

**Snapshot files inventory:**
- Architecture: `docs/system-architecture.md`
- Phase plans: `plans/260527-1730-ai-interview-coach-mvp/phase-{01..05}-*.md`
- AI orchestrator: `src/lib/ai/orchestrator.ts` + `src/lib/ai/prompts/*` + `src/lib/ai/model-router.ts`
- Question service: `src/features/interview/server/question-service.ts`
- Interview UI: `src/features/interview/interview-shell.tsx`
- Schemas (single source of truth for AI contracts): `src/features/interview/ai-schemas.ts`
- Seed extraction: `scripts/extract-seed-from-html.ts` (+ `extract-seed-{types,parsers,llm-helpers}.ts`)
- DB seed loader: `prisma/seed.ts`

## Dependencies

- Phase 02 depends on Phase 01 (DB schema, auth, seed bank).
- Phase 03 depends on Phase 02 (orchestrator, session flow).
- Phase 04 depends on Phase 03 (feedback data to aggregate).
- Phase 05 runs last; depends on all features being functional.

## Cross-cutting concerns (apply every phase)

- File size <200 LoC.
- Server-only modules use `import 'server-only'`.
- All AI calls route through `lib/ai/orchestrator.ts`.
- Every Route Handler authenticates first.
- Compile (`pnpm tsc --noEmit`) before considering a step done.

## Definition of Done (MVP)

Per PRD §26 — user can run a full session, get structured feedback for each answer, see a summary, view past sessions, view progress dashboard. Responsive, deployable, AI failures handled.

## Open questions

- See [docs/system-architecture.md §15 Open Questions](../../docs/system-architecture.md#open-questions).
