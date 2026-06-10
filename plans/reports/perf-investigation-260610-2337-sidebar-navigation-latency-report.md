# Sidebar Navigation Latency — Investigation Report

Date: 2026-06-10 | Branch: main | Scope: `(app)` route group nav performance

## TL;DR

Slowness is dominated by **repeated Supabase Auth network roundtrips per navigation** and a **zero-second client router cache** (every revisit re-runs the full server waterfall + skeleton flash). Dashboard adds a second client-side fetch waterfall on top. Skeletons already exist and are fine; the fix is to cut roundtrips and cache, not add more skeletons.

## Measured waterfall (by code inspection)

Per sidebar click to any `(app)` page:

1. `src/proxy.ts` runs on EVERY request → `supabase.auth.getUser()` = network call to Supabase Auth (~100–400ms). Result discarded; only used for cookie refresh.
2. Page runs `requireUser()` → `getCurrentUser()` → **second** `supabase.auth.getUser()` network call (`react cache()` is per-request only). DB user row lookup cached 30s via `unstable_cache` — good.
3. Page data queries start only AFTER auth resolves (serial).
4. **Dashboard worst case**: RSC response is just auth-gate + skeleton (`src/app/(app)/dashboard/page.tsx`), then client mounts → `fetch('/api/dashboard')` → that request passes proxy again (`getUser()` #3) + `getCurrentUser()` (`getUser()` #4) → 9 parallel Prisma aggregations.

Cold dashboard nav ≈ 4 Supabase Auth roundtrips (2 sequential pairs) + DB queries. Other pages ≈ 2 roundtrips + queries.

## Findings detail

| Area | State | Issue |
|---|---|---|
| `src/proxy.ts` | `auth.getUser()` every request incl. `/api/*` & prefetches | Pure network tax; API routes re-validate anyway |
| `src/lib/auth/session.ts` | 2nd `getUser()` per request; DB lookup cached 30s | Duplicate roundtrip |
| Router cache | No `staleTimes` config (`next.config.ts` empty) | dynamic default = 0s → revisits re-run everything, skeleton flashes every time |
| Dashboard | `useSuspenseQuery` staleTime 30min | Good for revisits, but still pays RSC auth-gate roundtrip each nav; first visit = double waterfall (RSC → then API) |
| Question bank | DB layer `unstable_cache` 1h (`study-service.ts`) | Good; but ~250-question RSC payload re-downloaded each visit (router cache 0) |
| History filters | `useTransition` + `router.replace` | Already keeps previous data — good pattern |
| loading.tsx | All routes have skeletons | Fine as-is |

## Recommendations (prioritized)

**P1 — Cut auth roundtrips (server latency)**
- Swap `auth.getUser()` → `auth.getClaims()` in `proxy.ts` and `getCurrentUser()`. With Supabase asymmetric JWT signing keys, verification is local (no network); refresh only when token expired. Removes up to 2 roundtrips/nav + 2/API call.
- Caveat: requires project migrated to new JWT signing keys (Supabase dashboard); on legacy HS256 `getClaims` falls back to network.
- Also consider narrowing proxy work for `/api/*` (handlers re-validate independently).

**P2 — Router cache `staleTimes` (one-line, biggest perceived win)**
- `experimental: { staleTimes: { dynamic: 30 } }` → sidebar back-and-forth within 30s is instant, no skeleton flash, zero server roundtrip.
- Trade-off: ≤30s staleness; pair with `router.refresh()` / `revalidatePath` after session-completing mutations.
- Verify exact config key against bundled Next 16 docs before implementing (AGENTS.md warning; node_modules read blocked this session by scout-block hook).

**P3 — Dashboard waterfall**
- Minimal: `queryClient.prefetchQuery(dashboardKeys.all(), fetchDashboard)` on app-shell mount or sidebar-link hover; combined with existing 30-min staleTime → instant dashboard.
- Structural (later): fetch in RSC + Suspense streaming or `HydrationBoundary` hydration; drops the extra `/api/dashboard` hop entirely.

**P4 — Perceived-speed polish**
- Add nav progress indicator (`useLinkStatus`, Next 16) for first visits.
- Confirm `StudyFilterBar` uses `useTransition` like history's (not verified).

**P5 — Longer-term: Next 16 `cacheComponents` + `use cache`**
- Question bank, resources = global data → cacheable static shells, prefetched on hover, instant nav with dynamic holes streaming. Bigger refactor; do after P1–P3 measured.

**P0 (verify in prod) — Region co-location**
- If Vercel function region ≠ Supabase project region, every auth/DB roundtrip = 200ms+. Check Vercel project region vs Supabase region; co-locate. Possibly the single largest production factor.

## Suggested measurement

Before/after: Chrome DevTools trace on nav click → contentful render; add `Server-Timing` headers around `getCurrentUser()` and data queries to attribute server time.

## Unresolved questions

1. Is the Supabase project on new asymmetric JWT signing keys? (gates P1's local verification)
2. Vercel function region vs Supabase region — co-located?
3. Acceptable staleness window for router cache (30s OK?)
4. Exact Next 16 config keys (`experimental.staleTimes`, `cacheComponents`) need confirming against `node_modules/next/dist/docs` — blocked by scout-block hook this session.
