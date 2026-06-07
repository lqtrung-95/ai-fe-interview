import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/common/brand-logo';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/session';
import { MarketingThemeToggle } from './marketing-theme-toggle';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/78 shadow-[0_1px_0_0_rgba(139,92,246,0.08)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <BrandLogo className="size-7 shrink-0" />
            <span className="truncate whitespace-nowrap text-sm font-semibold text-foreground sm:text-base">FrontEnd Coach</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/resources" className="hidden no-underline rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex">
              Resources
            </Link>
            <Link href="/demo" className="inline-flex no-underline rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:px-3">
              Demo
            </Link>
            <MarketingThemeToggle />
            {user ? (
              <span className="inline-flex">
                <Link href="/dashboard" className={buttonVariants({ size: 'sm', className: 'border-border/80 bg-primary px-2.5 text-primary-foreground hover:bg-primary/90 sm:px-3' })}>
                  <span className="sm:hidden">App</span>
                  <span className="hidden sm:inline">Go to dashboard</span>
                </Link>
              </span>
            ) : (
              <span className="inline-flex">
                <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'sm', className: 'border-border/80 bg-primary px-2.5 text-primary-foreground hover:bg-primary/90 sm:px-3' })}>
                  <span className="sm:hidden">Start</span>
                  <span className="hidden items-center gap-1 sm:inline-flex">
                    Get started <ArrowRight className="size-3.5" />
                  </span>
                </Link>
              </span>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/80 bg-background py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p>© {new Date().getFullYear()} FrontEnd Coach · Built for frontend engineers.</p>
        </div>
      </footer>
    </div>
  );
}
