import Link from 'next/link';
import { BrandLogo } from '@/components/common/brand-logo';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/session';
import { MarketingThemeToggle } from './marketing-theme-toggle';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 shadow-[0_1px_0_0_color-mix(in_oklab,var(--primary)_4%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <BrandLogo className="size-7 shrink-0" />
            <span className="truncate whitespace-nowrap text-sm font-semibold tracking-tight sm:text-base">FrontEnd Coach</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/resources" className="hidden no-underline rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              Resources
            </Link>
            <Link href="/demo" className="hidden no-underline rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              Demo
            </Link>
            <MarketingThemeToggle />
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: 'sm', className: 'px-2.5 sm:px-3' })}>
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">Go to dashboard →</span>
              </Link>
            ) : (
              <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'sm', className: 'px-2.5 sm:px-3' })}>
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
