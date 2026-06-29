# Phase A — Daily Practice Loop (Spaced Repetition + Streaks + Daily Goal)

**Goal:** Turn one-off practice into a daily-return habit. Every scored answer
advances a per-topic spaced-repetition schedule; a `/review` flow resurfaces due
topics; a streak + daily goal reward consistency. All built on existing infra.

## Why this design
- **Unit = topic, not question.** Practice questions are AI-generated fresh each
  session (only ~70% seeded), so the stable reviewable unit is the topic. A due
  topic → generate a fresh question via the existing question-stream flow.
- **Single hook point.** `persistFeedback()` in `feedback-service.ts` is the one
  place every scored answer (live + mock-batch) is written → upsert the topic's
  `ReviewItem` there. Bonus: *all* practice feeds the SR schedule, not just `/review`.
- **No enum/flow forking.** `/review` just creates a normal session pre-seeded
  with due topics. No new `SessionMode`, no `isReview` flag. Daily progress &
  streak derive from `ReviewItem.lastReviewedAt`.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Data model + migration (`ReviewItem`, `User` streak/goal fields) | Schema + SQL ready — **migration NOT applied to prod (user runs it)** | [phase-01](phase-01-data-model-and-migration.md) |
| 2 | Review scheduler service (SM-2-lite) + feedback hook | **Done** (incl. backfill script) | [phase-02](phase-02-review-scheduler-service.md) |
| 3 | `/review` session flow (due-topic seeding) | **Done** | [phase-03](phase-03-review-session-flow.md) |
| 4 | Streak + daily goal logic | **Done** (Settings goal control still pending) | [phase-04](phase-04-streak-and-daily-goal.md) |
| 5 | Dashboard card + verification (typecheck/lint/tests) | **Done** — typecheck/lint/tests green; smoke test blocked on migration | [phase-05](phase-05-dashboard-card-and-verification.md) |

## Remaining before launch
1. **Apply the prod migration** (user) → then `pnpm seed:backfill-reviews`.
2. **Smoke test** end-to-end once migration is live.
3. *(Optional polish)* Settings control to edit `dailyGoal` (3/5/10).

## Key dependencies
- Phase 1 (schema) blocks all others.
- Phase 2 blocks 3, 4, 5 (they read the scheduler service).
- Phases 4 & 5 can run in parallel after 2–3.

## Decisions (locked by user 2026-06-29)
1. **Pro gating** — ✅ **Free for everyone** (core loop drives retention/conversion).
2. **Daily goal** — ✅ default `3`/day, **user-editable in Settings**.
3. **Backfill** — ✅ **Yes**, seed `ReviewItem`s from existing users' past answers
   (Phase 2 step, now required not optional).

## Out of scope (later phases)
- Email/cron "reviews due" nudge (Phase A-2, infra exists).
- Conversational voice mock (Phase B).
