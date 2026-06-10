# Sidebar Navigation Perf — Implementation Report

Date: 2026-06-11 | Branch: main (uncommitted) | Investigation: `perf-investigation-260610-2337-sidebar-navigation-latency-report.md`

## Implemented

| Item | Change | Files |
|---|---|---|
| P1 Auth round-trips | `auth.getUser()` → `auth.getClaims()` (local JWT verify w/ asymmetric keys; network fallback on HS256/expired). Verified against current Supabase docs — getClaims is their recommended server-side check. | `src/proxy.ts`, `src/lib/auth/session.ts` |
| P2 Router cache | `experimental.staleTimes.dynamic: 30` — visited dynamic pages reused for 30s on client nav; no server waterfall, no skeleton flash. Verified syntax against Next 16.2 docs (still experimental). | `next.config.ts` |
| P3 Dashboard prefetch | Shared `dashboardQueryOptions` (TanStack `queryOptions`) + `DashboardPrefetcher` mounted in (app) layout — warms `/api/dashboard` on app-shell mount; prefetch no-ops while cache fresh (30 min staleTime). | `src/features/dashboard/hooks/use-dashboard-query.ts`, `src/features/dashboard/components/dashboard-prefetcher.tsx`, `src/app/(app)/layout.tsx` |
| P4 Nav pending feedback | `useLinkStatus` pending dot in sidebar + mobile menu links. Fixed-size, 100ms animation delay (no flash on fast nav, no layout shift) per Next 16 docs pattern. | `src/features/app/nav-link-pending-indicator.tsx`, `app-sidebar.tsx`, `app-header.tsx`, `globals.css` |
| P4b Filter bars | Verified both history + question-bank filter bars already use `useTransition` (keep previous data). No change needed. | — |

## P5 cacheComponents — attempted, reverted (evidence-based)

Enabled `cacheComponents: true`, ran build twice:

1. **Wave 1 (compile):** 19 errors — `export const runtime/dynamic` segment configs incompatible, across 16 API routes + `question-bank/[id]/page.tsx`. The page one is a deliberate workaround for a streaming hydration-mismatch bug — removal = regression risk.
2. **Wave 2 (prerender, after stripping configs):** `Route "/coding-challenges/[id]": Uncached data was accessed outside of <Suspense>` — fails at root providers. Cascade expected through every route lacking a Suspense/loading boundary (detail pages, marketing, reader, sign-in) + `(app)/layout.tsx` `headers()`/`getCurrentUser()` usage requires restructuring auth gating below Suspense.

Full migration needs: Suspense boundaries on ~10 routes, (app) layout auth restructure, re-validation of hydration workaround, likely `unstable_cache` → `use cache` migration, regression pass. Reverted flag + segment-config removals via git. Recommend as separate planned migration (`/ck:plan`) if pursued.

## Verification

- `pnpm typecheck` ✅
- `pnpm lint` — no new issues in touched files (63 pre-existing problems elsewhere)
- `pnpm build` ✅ (production build clean after P5 revert)

## Expected impact

- Per-nav: removes up to 2 Supabase Auth network round-trips (RSC) + 2 more per API call — IF project uses asymmetric JWT signing keys (else behavior unchanged, no regression).
- Revisit nav within 30s: instant (zero server round-trip).
- Dashboard first visit: data already in flight/cached from app-shell mount instead of starting after navigation.
- Slow first navs now show inline pending feedback.

## Unresolved questions

1. Supabase project JWT signing keys: confirm migrated to asymmetric (Supabase dashboard → Settings → JWT Keys). Without it P1 gains nothing (but loses nothing).
2. Vercel ↔ Supabase region co-location not verified (needs dashboard access) — potentially largest production factor.
3. 30s router-cache staleness: if a flow shows stale data after a mutation (e.g. completing a session then opening History), add `router.refresh()` at that mutation site.
4. `experimental.staleTimes` is officially "not recommended for production" — works, widely used, but track Next release notes.
5. P5 cacheComponents: separate migration plan if wanted.
