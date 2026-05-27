import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AppSidebar } from '@/features/app/app-sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar userName={user.name} userEmail={user.email} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
