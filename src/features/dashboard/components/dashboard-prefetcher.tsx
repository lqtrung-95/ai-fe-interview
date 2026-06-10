'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardQueryOptions } from '../hooks/use-dashboard-query';

/**
 * Warms the dashboard query cache as soon as the authenticated app shell
 * mounts, so landing on /dashboard renders instantly instead of waiting on
 * the /api/dashboard round-trip after navigation.
 *
 * prefetchQuery respects staleTime (30 min) — it no-ops when the cache is
 * still fresh, and useSuspenseQuery dedupes against an in-flight prefetch.
 * Renders nothing.
 */
export function DashboardPrefetcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery(dashboardQueryOptions);
  }, [queryClient]);

  return null;
}
