import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary-foreground" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
            <span className="font-semibold tracking-tight text-foreground">Interview Coach</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/demo" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Demo
            </Link>
            <Link href="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Sign in
            </Link>
            <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'sm' })}>
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <p>© {new Date().getFullYear()} AI Interview Coach · Practice frontend interviews with AI feedback.</p>
        </div>
      </footer>
    </div>
  );
}
