---
phase: 2
title: "Promo Code Backend"
status: completed
effort: "2h"
dependencies: [1]
---

# Phase 2: Promo Code Backend

## Overview

Update `isProUser()` to enforce `proExpiresAt` expiry, add a `redeemPromoCode` server action, and create an admin CLI script for issuing codes.

## Requirements

- **Functional:**
  - `isProUser()` returns false when `proExpiresAt < now`, and lazily revokes `isPro` in the DB.
  - `redeemPromoCode(code)` validates code and grants timed Pro access atomically.
  - Admin CLI creates new promo codes.
- **Non-functional:** Redemption must be atomic (race-safe via `@@unique` constraint + transaction). Rate-limit: 5 attempts/min per user (reuse existing Redis rate-limiter pattern if present, else simple DB check).

## Architecture

### Expiry check (write-through revocation)

```ts
// src/lib/subscription/subscription-service.ts
export async function isProUser(user: DbUser): Promise<boolean> {
  if (!user.isPro) return false;
  // Permanent subscriber (Polar) — no expiry
  if (!user.proExpiresAt) return true;
  // Promo grant — check expiry
  if (user.proExpiresAt > new Date()) return true;
  // Expired: lazily revoke (fire-and-forget, don't block render)
  prisma.user.update({ where: { id: user.id }, data: { isPro: false } }).catch(() => {});
  return false;
}
```

**Important:** All existing callers pass a `user` object from `getCurrentUser()` which already loads `isPro`. The function was previously synchronous `(user: { isPro: boolean }) => boolean` — changing the signature to `async` requires updating all call sites.

### Redemption server action

```
src/features/subscription/redeem-promo-code-action.ts
```

Flow:
1. `requireUser()` — must be signed in.
2. Normalise code to UPPERCASE, trim whitespace.
3. Check user already pro — if so, return early with `already_pro` error.
4. Load `PromoCode` where `code = input`. Not found → `invalid_code`.
5. Check `expiresAt` — if set and past → `expired_code`.
6. Check `maxUses` — if `maxUses > 0 && usedCount >= maxUses` → `exhausted`.
7. Check `PromoRedemption` unique constraint — if exists → `already_redeemed`.
8. **Transaction:**
   - Create `PromoRedemption` (catches unique violation race)
   - Increment `PromoCode.usedCount`
   - Update `User`: `isPro=true`, `proExpiresAt=grantedAt+durationDays`
9. Return `{ success: true, expiresAt }`.

### Admin CLI script

```
scripts/create-promo-code.ts
```

Usage:
```bash
# 7-day trial, max 100 uses, expires 2026-12-31
pnpm tsx scripts/create-promo-code.ts \
  --code LAUNCH7 \
  --days 7 \
  --max-uses 100 \
  --expires 2026-12-31 \
  --note "Launch promotion July 2026"

# Unlimited uses, no code expiry
pnpm tsx scripts/create-promo-code.ts --code BETA30 --days 30
```

## Related Code Files

- Modify: `src/lib/subscription/subscription-service.ts`
- Create: `src/features/subscription/redeem-promo-code-action.ts`
- Create: `scripts/create-promo-code.ts`
- Modify: Any existing call site of `isProUser()` to handle async (grep: `isProUser`)

## Implementation Steps

1. **Update `isProUser`** in `src/lib/subscription/subscription-service.ts`:
   - Change signature to `async function isProUser(user: DbUser): Promise<boolean>`
   - Add `proExpiresAt` check with lazy DB revocation
   - Update existing callers: `create-session-action.ts`, any middleware/route that calls it

2. **Create `redeem-promo-code-action.ts`** with `'use server'` directive:
   ```ts
   'use server';
   import { requireUser } from '@/lib/auth/session';
   import { prisma } from '@/lib/db/client';

   export type RedeemResult =
     | { success: true; expiresAt: Date }
     | { success: false; error: 'invalid_code' | 'expired_code' | 'exhausted' | 'already_redeemed' | 'already_pro' };

   export async function redeemPromoCode(rawCode: string): Promise<RedeemResult> { ... }
   ```

3. **Create `scripts/create-promo-code.ts`** (tsx, Node 20):
   - Parse CLI args with `process.argv` (no external CLI parser — KISS)
   - Upsert `PromoCode` (update note/maxUses if code already exists)
   - Print confirmation with generated `id`

4. **Grep for `isProUser` callers** and update await:
   ```bash
   grep -rn "isProUser" src/ --include="*.ts" --include="*.tsx"
   ```
   Expected: `create-session-action.ts`, possibly `upgrade-wall-dialog.tsx` (client — different path)

## Success Criteria

- [ ] `isProUser` returns false for user with `isPro=true` but `proExpiresAt` in the past
- [ ] `isProUser` does not call DB for permanent Pro users (no `proExpiresAt`)
- [ ] `redeemPromoCode("INVALID")` returns `{ success: false, error: 'invalid_code' }`
- [ ] Concurrent redemptions of same code by same user → only one `PromoRedemption` row
- [ ] `pnpm tsx scripts/create-promo-code.ts --code TEST7 --days 7` creates a DB row
- [ ] TypeScript compiles with no errors after async change to `isProUser`

## Risk Assessment

- **Async `isProUser` change:** Could break existing callers if not all updated. Mitigation: grep all callers before writing, update atomically.
- **Race on redemption:** Two requests at the same time. Mitigation: `@@unique([promoCodeId, userId])` constraint causes the second DB write to throw a unique constraint error — catch `P2002` Prisma error code and return `already_redeemed`.
