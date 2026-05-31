import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AppHeader } from '@/features/app/app-header';
import { AppSidebar } from '@/features/app/app-sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  // New users who haven't completed onboarding must do so before accessing the app.
  // /settings is explicitly excluded so users can update their profile even if
  // targetRole is transiently missing (e.g. right after account creation).
  const pathname = (await headers()).get('x-pathname') ?? '';
  const onboardingExempt = ['/onboarding', '/settings'];
  if (!user.targetRole && !onboardingExempt.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isPro={user.isPro} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader userName={user.name} userEmail={user.email} userImage={user.image} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
