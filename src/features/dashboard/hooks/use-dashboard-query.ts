'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/query/keys';
import type { DashboardData } from '../dashboard-types';

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw Object.assign(new Error('Failed to fetch dashboard data'), { status: res.status });
  return res.json();
}

/**
 * Fetches and caches all dashboard data client-side.
 * staleTime of 30 min means return visits render instantly from memory.
 * Invalidated by useCompleteSessionMutation / useEndSessionMutation via dashboardKeys.all().
 */
export function useDashboardQuery() {
  return useSuspenseQuery<DashboardData>({
    queryKey: dashboardKeys.all(),
    queryFn: fetchDashboard,
    staleTime: 30 * 60 * 1000,
  });
}
