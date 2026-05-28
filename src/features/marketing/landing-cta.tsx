import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function LandingCta() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
        <h2 className="text-3xl font-bold tracking-tight">Start your first mock interview</h2>
        <p className="mt-3 text-primary-foreground/80">
          Three questions. Honest feedback. Five minutes well spent.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-in?next=/onboarding"
            className={buttonVariants({ size: 'lg', variant: 'secondary' })}
          >
            Start practicing free
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center justify-center rounded-md border border-primary-foreground/30 bg-transparent px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}
