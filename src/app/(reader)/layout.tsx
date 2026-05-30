import { getCurrentUser } from '@/lib/auth/session';
import { ReaderHeader } from '@/features/app/reader-header';

/**
 * Reader layout — public, full-width, no app sidebar.
 * Auth is optional: logged-in users get the app breadcrumb and user controls;
 * guests get a marketing-style header with Sign In / Get Started links.
 */
export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  // No redirect — handbook is publicly accessible
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ReaderHeader user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
