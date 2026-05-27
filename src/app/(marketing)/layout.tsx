import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-semibold tracking-tight">
            AI Interview Coach
          </Link>
          <nav className="flex items-center gap-2">
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
