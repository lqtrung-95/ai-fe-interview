---
title: "TanStack Query v5 — Full Adoption"
description: "Install TanStack Query v5, wire QueryClientProvider, convert all client-side fetch mutations to useMutation hooks, add useQuery for client-cached reads, optimistic MarkStudiedButton, cache invalidation pattern, and devtools."
status: pending
priority: P2
branch: "main"
tags: ["tanstack-query", "react-query", "mutations", "caching"]
blockedBy: []
blocks: []
created: "2026-05-29T08:32:25.178Z"
createdBy: "ck:plan"
source: skill
---

# TanStack Query v5 — Full Adoption

## Overview

Adds TanStack Query v5 as the client-side async state manager. Current state:
- All page data reads are RSC (stays unchanged — no migration of server components)
- Client mutations use raw `fetch()` inside `answer-flow-client.ts` and `use-interview-flow.ts`
- Study plan toggle uses a server action with manual `useState`
- No optimistic UI, no cache invalidation from client, no devtools

After this plan:
- Centralized `QueryClient` with sane defaults (staleTime, gcTime, retry)
- Type-safe query-key factory (`src/lib/query/keys.ts`)
- All interview mutations → `useMutation` hooks with automatic loading/error states
- `MarkStudiedButton` → optimistic mutation with rollback
- `useQuery` for study-plan progress (avoids full page reload after toggle)
- `queryClient.invalidateQueries` as the single invalidation primitive
- React Query Devtools in development only

## Architecture Decision

> RSC stays the primary data layer for page loads. TanStack Query fills the client-side gap:
> **mutations** (currently ad-hoc), **optimistic updates** (currently absent), and
> **stale client state** (currently requires full reload).

SSE streams (`use-question-stream.ts`, `use-feedback-stream.ts`) are **not** wrapped — they are not standard request/response and TanStack Query provides no benefit there. Zustand interview state machine is **not** replaced — it owns UI phase transitions, TQ handles network I/O.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Setup & Provider](./phase-01-setup-provider.md) | Pending | 1h |
| 2 | [Mutation Hooks](./phase-02-mutation-hooks.md) | Pending | 2h |
| 3 | [Client Queries & Optimistic Updates](./phase-03-client-queries-optimistic-updates.md) | Pending | 2h |
| 4 | [Cache Invalidation & Devtools](./phase-04-cache-invalidation-devtools.md) | Pending | 1h |

## Files to create

```
src/lib/query/client.ts          QueryClient factory (shared defaults)
src/lib/query/provider.tsx       'use client' QueryClientProvider wrapper
src/lib/query/keys.ts            Type-safe query key factory
src/features/interview/hooks/use-interview-mutations.ts
src/features/study-plan/hooks/use-study-plan-mutations.ts
src/features/study-plan/hooks/use-study-plan-query.ts
```

## Files to modify

```
src/app/layout.tsx                           wrap body with QueryProvider
src/features/interview/use-interview-flow.ts use mutation hooks instead of raw awaits
src/features/study-plan/components/mark-studied-button.tsx  optimistic useMutation
src/features/study-plan/components/study-plan-setup-form.tsx  useMutation wrapper
```

## Dependencies

None — no existing plans overlap.
