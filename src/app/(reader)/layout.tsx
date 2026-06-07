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
    <div className="reader-shell relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      <div aria-hidden="true" className="reader-atmosphere reader-atmosphere-primary" />
      <div aria-hidden="true" className="reader-atmosphere reader-atmosphere-teal" />
      <ReaderHeader user={user} />
      <main className="reader-main relative z-10 min-w-0 flex-1 pt-14 print:pt-0">{children}</main>
    </div>
  );
}
