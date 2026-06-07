---
title: "Coding Challenges Feature"
status: completed
createdAt: 2026-06-07
---

# Coding Challenges Feature

Interactive JavaScript/TypeScript coding exercises with real code execution, test-case validation, and AI-powered code review — positioned as a standalone feature adjacent to the existing text interview flow.

## Goal

Let users practice writing actual code in a Monaco editor, run it against hidden + visible test cases via Piston API (free, no auth), and receive AI analysis of their solution quality, time/space complexity, and frontend-specific best practices.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 01 | [Schema + Seed Challenges](./phase-01-schema-and-seed-challenges.md) | completed | 3h |
| 02 | [Code Execution API](./phase-02-code-execution-api.md) | completed | 3h |
| 03 | [Challenge List Page](./phase-03-challenge-list-page.md) | completed | 2h |
| 04 | [Challenge Workspace UI](./phase-04-challenge-workspace-ui.md) | completed | 5h |
| 05 | [AI Code Review](./phase-05-ai-code-review.md) | completed | 3h |
| 06 | [Navigation + Dashboard Integration](./phase-06-navigation-and-dashboard-integration.md) | completed | 2h |

**Total estimated effort:** ~18h

## Key Dependencies

- `@monaco-editor/react` — code editor (new dependency)
- Piston API (`https://emkc.org/api/v2/piston`) — free sandboxed code execution, no auth required
- Existing: Prisma 7, Supabase, Vercel AI SDK 6, shadcn/ui, Tailwind v4

## Scope

- Language: **JavaScript only** for MVP (frontend interview context; TypeScript transpilation adds complexity)
- Challenges seeded manually: 15 curated JS challenges covering debounce, closures, async, DOM, array methods, etc.
- AI review is optional (Pro feature) — triggered separately after submission
- No live collaboration, no leaderboards, no custom test case creation in MVP

## Out of Scope (MVP)

- TypeScript execution (add later — requires tsconfig + transpile step)
- Integration into existing interview sessions as a question type
- User-uploaded challenges
- Time-limited challenge runs

## Validation Log

### Session 1 — 2026-06-07
**Trigger:** Pre-implementation validation interview
**Questions asked:** 6

#### Questions & Answers

1. **[Assumptions]** Phase 3 references `getOptionalUser()` which doesn't exist. Real function is `getCurrentUser()`. How should the challenge list page handle unauthenticated visitors?
   - Options: Use getCurrentUser(), show list to all | Require sign-in | Use getCurrentUser(), hide from unauthenticated
   - **Answer:** Use `getCurrentUser()`, show list to all
   - **Rationale:** Challenge catalog is public browsing; auth gate only at submit time.

2. **[Risks]** Piston is a community-hosted public API with no SLA. What's the plan if it goes down?
   - Options: Return 503 with user-friendly message | Self-hosted fallback | Judge0 config flag
   - **Answer:** Return user-friendly 503, document the risk, accept dependency for MVP
   - **Rationale:** Acceptable for MVP; revisit if uptime proves problematic.

3. **[Architecture]** Harness function naming contract — keep `solution` as fixed name?
   - Options: Keep `solution` fixed | Auto-detect | module.exports pattern
   - **Answer:** Keep `solution` as fixed name, enforce in starter code
   - **Rationale:** Simpler harness and onboarding; all stubs use `function solution(...)`.

4. **[Scope]** AI review gate — passing submissions only, or also failing?
   - Options: Passing only | Any submission | Different framing per status
   - **Answer:** `status: 'passed'` = ALL test cases pass. AI review only on fully passing submissions.
   - **Rationale:** Avoids reviewing/legitimising broken code; consistent with unit-test semantics.

5. **[Architecture]** Dashboard: coding challenges in existing readiness metrics, or separate?
   - Options: Fully separate stat card | Include in readiness score
   - **Answer:** Fully separate stat card — don't touch existing metrics
   - **Rationale:** Zero regression risk; clean separation of concerns.

6. **[Scope]** AI review limits for Pro users?
   - Options: Cache after first generation | One review per challenge | Unlimited
   - **Answer:** Cache after first generation (1 review per user+submission)
   - **Rationale:** Minimises token spend; repeat views are free after first generation.

#### Confirmed Decisions
- Auth on list: `getCurrentUser()`, no redirect, catalog is public — Phase 3
- Piston fallback: 503 + user-friendly message, no secondary backend — Phase 2
- Harness contract: `solution` function name, fixed — Phase 1 & 2
- Pass definition: ALL test cases must pass for `status: 'passed'` — Phase 2 & 5
- Dashboard: separate stat card only — Phase 6
- AI review caching: per (user, submission), cached after first call — Phase 5

#### Action Items
- [x] Phase 3: Replace `getOptionalUser()` with `getCurrentUser()` — DONE
- [x] Phase 2: Add 503 + error message for Piston fetch failure — DONE
- [x] Phase 2: Clarify `status: 'passed'` = 100% test cases pass — DONE

#### Impact on Phases
- Phase 2: Submit route now returns 503 on Piston failure; status definition clarified
- Phase 3: `getOptionalUser` → `getCurrentUser`; page open to all unauthenticated users
- Phase 5: AI review restricted to `status = 'passed'` (all tests pass), cached per submission

### Verification Results
- **Tier:** Full (6 phases)
- **Claims checked:** 12
- **Verified:** 11 | **Failed:** 1 | **Unverified:** 0
- **Failures:** `getOptionalUser()` — does not exist; replaced with `getCurrentUser()` (src/lib/auth/session.ts:46)

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-06
- Decision deltas checked: 6
- Reconciled stale references: 2 (`getOptionalUser` in phase-03, missing 503 handling in phase-02)
- Unresolved contradictions: 0
