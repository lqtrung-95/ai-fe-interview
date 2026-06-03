---
title: "Pro Status Badge + Promo Code Redemption"
description: "Show Pro account status in the sidebar; allow admin to issue promo codes that grant timed Pro access to users."
status: pending
priority: P2
branch: "main"
tags: ["subscription", "promo", "ui"]
blockedBy: []
blocks: []
created: "2026-06-03T10:00:36.012Z"
createdBy: "ck:plan"
source: skill
---

# Pro Status Badge + Promo Code Redemption

## Overview

Two related features touching the same subscription layer:

1. **Pro badge in sidebar** — replace the silent no-op for pro users with a visible "Pro" chip showing `proSince` date; for promo-granted users, show the expiry date.
2. **Promo code redemption** — admin creates time-limited codes via a CLI script; users redeem them on the upgrade page or a dedicated `/redeem` route, granting N days of Pro access.

No payment changes. No Polar API calls. Minimal DB surface: 2 new tables, 1 new field on User.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Schema Migration](./phase-01-schema-migration.md) | ✅ Complete |
| 2 | [Promo Code Backend](./phase-02-promo-code-backend.md) | ✅ Complete |
| 3 | [Sidebar Badge and Redeem UI](./phase-03-sidebar-badge-and-redeem-ui.md) | ✅ Complete |

## Key Decisions

- `isPro` remains the gating boolean. Promo grants set `isPro=true` + `proExpiresAt`. An expiry check runs inside `isProUser()` — if `proExpiresAt < now`, the function returns false AND lazily sets `isPro=false` (write-through revocation — no cron needed).
- Polar paying subscribers have `proExpiresAt = null` (permanent) — badge shows "Member since {date}".
- Promo users have `proExpiresAt` set — badge shows "Pro · expires {date}".
- Admin-only code creation via `scripts/create-promo-code.ts` (no admin UI in scope).

## Dependencies

None — standalone feature branch off main.
