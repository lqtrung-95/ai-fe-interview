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
    <div className="app-shell relative flex min-h-screen overflow-x-clip bg-background">
      <div aria-hidden="true" className="app-atmosphere app-atmosphere-primary" />
      <div aria-hidden="true" className="app-atmosphere app-atmosphere-teal" />
      <AppSidebar
        isPro={user.isPro}
        proExpiresAt={user.proExpiresAt?.toISOString() ?? null}
        proSince={user.proSince?.toISOString() ?? null}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col md:pl-56">
        <AppHeader userName={user.name} userEmail={user.email} userImage={user.image} />
        <main className="app-main min-w-0 flex-1 pt-14">{children}</main>
      </div>
    </div>
  );
}
