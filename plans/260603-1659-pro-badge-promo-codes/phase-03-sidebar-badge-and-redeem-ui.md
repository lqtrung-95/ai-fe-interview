---
phase: 3
title: "Sidebar Badge and Redeem UI"
status: completed
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Sidebar Badge and Redeem UI

## Overview

Two UI surfaces:
1. **Sidebar Pro badge** — replaces the empty slot for pro users with a status chip.
2. **Promo redeem form** — added to the existing `/upgrade` page (pro users see it too, to redeem additional codes).

## Requirements

- **Functional:**
  - Sidebar shows Pro badge with date context for authenticated pro users.
  - Upgrade page gains a collapsible "Have a promo code?" section with an inline form.
  - Form submission calls `redeemPromoCode`, shows inline success/error feedback, redirects to dashboard on success.
- **Non-functional:** No new routes needed — redeem form lives inside existing `/upgrade` page. Sidebar change is CSS-only visual update, no new data fetching.

## Architecture

### Sidebar slot (bottom section)

Current: shows `<Link href="/upgrade">Upgrade to Pro</Link>` for `!isPro`, nothing for `isPro`.

New: pass `proExpiresAt` alongside `isPro` from the app layout.

```tsx
// app/(app)/layout.tsx
<AppSidebar isPro={user.isPro} proExpiresAt={user.proExpiresAt ?? null} />
```

```tsx
// features/app/app-sidebar.tsx
{isPro ? (
  <ProBadgeSlot proExpiresAt={proExpiresAt} />
) : (
  <Link href="/upgrade">Upgrade to Pro</Link>
)}
```

`ProBadgeSlot` (inline sub-component in the same file, ~15 lines):
- Shows `✓ Pro` chip with teal/green accent
- If `proExpiresAt`: `"Pro · expires {formatDate(proExpiresAt)}"`
- If no `proExpiresAt` (Polar subscriber): `"Pro · since {formatDate(proSince)}"`

Since `proSince` is also on the user, pass it too for the subscriber case. But layout already re-fetches `user` — no extra DB call.

### Redeem form on `/upgrade`

The upgrade page currently redirects pro users away. Remove that redirect — pro users should also be able to redeem codes (e.g. they want to extend via a gift code).

Add below the pricing cards:

```tsx
<RedeemCodeForm />   {/* client component */}
```

`RedeemCodeForm` (`src/features/subscription/redeem-code-form.tsx`):
- Client component with `useTransition` for pending state
- Single text input (uppercase normalisation on blur)
- "Apply code" button
- Inline feedback: success (green check + expires date) or error (red message per error enum)
- On success: `router.push('/dashboard')` after 1.5s (or immediate with a toast)

```tsx
'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { redeemPromoCode } from '@/features/subscription/redeem-promo-code-action';

const ERROR_MESSAGES = {
  invalid_code: 'Code not found.',
  expired_code: 'This code has expired.',
  exhausted: 'This code has reached its usage limit.',
  already_redeemed: 'You have already used this code.',
  already_pro: 'You already have an active Pro subscription.',
};
```

Layout for the redeem section on `/upgrade`:

```
────────────────────────────────────────
  Have a promo code?
  [  Enter code          ] [Apply]
  ✓ Pro access granted until Jan 1, 2027
────────────────────────────────────────
```

## Related Code Files

- Modify: `src/app/(app)/layout.tsx` — pass `proExpiresAt` + `proSince` to sidebar
- Modify: `src/features/app/app-sidebar.tsx` — add `ProBadgeSlot`, update props type
- Modify: `src/app/(app)/upgrade/page.tsx` — remove pro redirect, add `<RedeemCodeForm />`
- Create: `src/features/subscription/redeem-code-form.tsx`

## Implementation Steps

1. **`app/(app)/layout.tsx`**: add `proExpiresAt` and `proSince` to `AppSidebar` props call:
   ```tsx
   <AppSidebar
     isPro={user.isPro}
     proExpiresAt={user.proExpiresAt ?? null}
     proSince={user.proSince ?? null}
   />
   ```

2. **`app-sidebar.tsx`**: update `Props` type and add `ProBadgeSlot`:
   ```tsx
   interface Props {
     isPro?: boolean;
     proExpiresAt?: Date | null;
     proSince?: Date | null;
   }
   ```
   Replace the `!isPro` conditional block with a ternary rendering `ProBadgeSlot` or the upgrade link.

3. **`upgrade/page.tsx`**: remove `if (user.isPro) redirect('/dashboard')` — pro users can still visit to redeem codes. Import and render `<RedeemCodeForm />` below the pricing section.

4. **Create `redeem-code-form.tsx`**: client component using `useTransition` + `redeemPromoCode` action. Handle all `RedeemResult` error keys with human-readable messages.

5. **Date formatting**: use `Intl.DateTimeFormat` directly (no extra library) — e.g.
   ```ts
   new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
   ```

## Success Criteria

- [ ] Pro user sees `✓ Pro · since {date}` in sidebar bottom slot (Polar subscriber)
- [ ] Promo user sees `✓ Pro · expires {date}` in sidebar bottom slot
- [ ] Free user still sees "Upgrade to Pro" link unchanged
- [ ] `/upgrade` page renders for both free and pro users
- [ ] Entering an invalid code shows "Code not found." inline, no page reload
- [ ] Entering a valid code updates DB, shows expiry, redirects to dashboard
- [ ] TypeScript compiles; no `any` introduced

## Risk Assessment

- **Sidebar prop change:** Minimal — only one call site in `layout.tsx`.
- **Removing pro redirect from `/upgrade`:** Intentional; pro users seeing the pricing page is fine and lets them redeem codes. Confirm there's no other side-effect (e.g. checkout links only work for free users — that's OK, pro users just won't use them).
