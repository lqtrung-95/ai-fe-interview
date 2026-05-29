---
phase: 1
title: "Setup & Provider"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Setup & Provider

## Overview

Install `@tanstack/react-query` v5 and `@tanstack/react-query-devtools`. Create the `QueryClient` factory with shared defaults, a `'use client'` provider component, and a type-safe query key factory. Wire the provider into `app/layout.tsx`.

## Requirements

- Functional:
  - `QueryClient` available to all client components in `(app)` layout
  - DevTools rendered only in `process.env.NODE_ENV === 'development'`
  - Query keys centralized so future refactors never break cache lookups
- Non-functional:
  - Zero RSC breakage — the provider wraps the body, RSC pages are unaffected
  - `staleTime: 60_000` default (prevents double-fetch on tab focus for slow pages)

## Architecture

```
app/layout.tsx  →  <QueryProvider>  →  children (all routes)
                       ↓
               new QueryClient({ defaultOptions })
                       ↓
         ReactQueryDevtools (dev only, position="bottom-right")
```

The `QueryClient` must be created **inside a component** (not at module scope) to avoid shared state between server renders. Use the `useState` pattern recommended by TanStack docs.

## Related Code Files

- Create: `src/lib/query/client.ts`
- Create: `src/lib/query/provider.tsx`
- Create: `src/lib/query/keys.ts`
- Modify: `src/app/layout.tsx`

## Implementation Steps

1. **Install dependencies**
   ```bash
   pnpm add @tanstack/react-query @tanstack/react-query-devtools
   ```

2. **Create `src/lib/query/client.ts`**
   ```typescript
   import { QueryClient } from '@tanstack/react-query';

   export function makeQueryClient() {
     return new QueryClient({
       defaultOptions: {
         queries: {
           // Data is fresh for 60 s — prevents re-fetch on immediate tab refocus
           staleTime: 60 * 1000,
           // Keep inactive cache for 5 min
           gcTime: 5 * 60 * 1000,
           // Don't retry on 4xx errors
           retry: (failureCount, error: unknown) => {
             if (error instanceof Error && 'status' in error) {
               const status = (error as { status: number }).status;
               if (status >= 400 && status < 500) return false;
             }
             return failureCount < 2;
           },
         },
         mutations: {
           // Surface mutation errors to component; don't swallow
           throwOnError: false,
         },
       },
     });
   }
   ```

3. **Create `src/lib/query/provider.tsx`**
   ```typescript
   'use client';

   import { useState } from 'react';
   import { QueryClientProvider } from '@tanstack/react-query';
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   import { makeQueryClient } from './client';

   export function QueryProvider({ children }: { children: React.ReactNode }) {
     // Create per-render instance (SSR-safe — avoids shared singleton)
     const [queryClient] = useState(() => makeQueryClient());

     return (
       <QueryClientProvider client={queryClient}>
         {children}
         {process.env.NODE_ENV === 'development' && (
           <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
         )}
       </QueryClientProvider>
     );
   }
   ```

4. **Create `src/lib/query/keys.ts`** — centralized, hierarchical key factory
   ```typescript
   // Query key factory — use these everywhere to ensure cache coherence.
   // Pattern: [domain, ...scope] so invalidateQueries({ queryKey: keys.base })
   // matches all sub-keys.

   export const studyPlanKeys = {
     all:      () => ['studyPlan'] as const,
     progress: () => ['studyPlan', 'progress'] as const,
     question: (id: string) => ['studyPlan', 'question', id] as const,
   };

   export const historyKeys = {
     all:     () => ['history'] as const,
     list:    (filters: Record<string, string>) => ['history', 'list', filters] as const,
     detail:  (sessionId: string) => ['history', 'detail', sessionId] as const,
   };

   export const dashboardKeys = {
     all:     () => ['dashboard'] as const,
     overview: () => ['dashboard', 'overview'] as const,
   };

   export const interviewKeys = {
     all:     () => ['interview'] as const,
     session: (id: string) => ['interview', 'session', id] as const,
   };
   ```

5. **Modify `src/app/layout.tsx`** — wrap body content
   ```tsx
   // Add import
   import { QueryProvider } from '@/lib/query/provider';

   // Wrap children
   <body className="min-h-full flex flex-col">
     <QueryProvider>{children}</QueryProvider>
   </body>
   ```

6. **Compile check**
   ```bash
   pnpm tsc --noEmit
   ```

## Success Criteria

- [ ] `pnpm add @tanstack/react-query @tanstack/react-query-devtools` succeeds
- [ ] `QueryProvider` wraps `<body>` in `app/layout.tsx`
- [ ] React Query Devtools panel visible at bottom-right in dev mode
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] All RSC pages still render (no hydration errors)

## Risk Assessment

- **Hydration mismatch** if QueryClient is created at module scope (shared between requests on server). Mitigation: `useState(() => makeQueryClient())` pattern creates a fresh instance per client mount.
- **DevTools bundle** in production. Mitigation: `process.env.NODE_ENV === 'development'` guard — Next.js tree-shakes it out in `next build`.
