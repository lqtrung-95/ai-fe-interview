import Link from 'next/link';
import { BrandLogo } from '@/components/common/brand-logo';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/session';
import { MarketingThemeToggle } from './marketing-theme-toggle';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo className="size-7" />
            <span className="font-semibold tracking-tight">FrontEnd Coach</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/resources" className="no-underline rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Resources
            </Link>
            <Link href="/demo" className="no-underline rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Demo
            </Link>
            <MarketingThemeToggle />
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>
                Go to dashboard →
              </Link>
            ) : (
              <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'sm' })}>
                Get started
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p>© {new Date().getFullYear()} FrontEnd Coach · Built for frontend engineers.</p>
        </div>
      </footer>
    </div>
  );
}
