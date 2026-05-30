---
phase: 5
title: "Build Verification"
status: pending
priority: P2
effort: "30m"
dependencies: [4]
---

# Phase 5: Build Verification

## Overview

Run TypeScript type-check and production build to confirm zero errors. Spot-check the
rendered pages visually and verify the quiz/flashcard interactions work correctly.

## Requirements

- Functional: `pnpm build` succeeds with zero TypeScript errors and zero Next.js build errors
- Non-functional: No regressions to existing routes

## Implementation Steps

1. **TypeScript check**:
   ```bash
   PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH" pnpm tsc --noEmit
   ```
   Fix any type errors before proceeding.

2. **Production build**:
   ```bash
   PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH" pnpm build
   ```
   Confirm:
   - `/resources` and `/resources/frontend-system-design` appear in the route table as `ƒ` (dynamic/server)
   - No existing routes removed or broken

3. **JSON size check**:
   ```bash
   wc -c src/data/resources/frontend-system-design.json
   ```
   If > 1MB, identify and strip any redundant whitespace or consider splitting SVG data.

4. **Spot-check translations** — open `frontend-system-design.json` and verify 5 randomly
   chosen section titles/intros are in fluent English (not garbled or machine-literal).

5. **Quiz answer validation** — for 3 quiz blocks, manually verify that `answer` index
   matches the actually correct option text in `options[]`.

## Success Criteria

- [ ] `pnpm tsc --noEmit` — zero errors
- [ ] `pnpm build` — zero errors, all routes present
- [ ] `/resources` page renders guide card
- [ ] `/resources/frontend-system-design` renders all 38 sections
- [ ] At least one quiz interaction works (select option → correct/wrong state shown)
- [ ] At least one flashcard flip works on click
- [ ] No console errors in browser dev tools on either page
- [ ] Existing routes (`/dashboard`, `/question-bank`, etc.) unaffected

## Risk Assessment

- Low risk — this phase is verification only, no new code.
- If build fails due to JSON import, fix per Phase 4 risk note (switch to `readFileSync`).
