import { requireUser } from '@/lib/auth/session';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back{user.name ? `, ${user.name}` : ''}.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dashboard coming in Phase 04. For now, head to Practice to start a session.
      </p>
    </div>
  );
}
