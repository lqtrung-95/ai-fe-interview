import { requireUser } from '@/lib/auth/session';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  // Auth gate only — all data fetching happens client-side via useDashboardQuery.
  await requireUser();
  return <DashboardClient />;
}
