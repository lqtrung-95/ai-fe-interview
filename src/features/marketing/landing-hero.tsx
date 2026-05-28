import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function LandingHero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Built for senior frontend engineers
      </div>
      <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        Ace your frontend
        <span className="block text-primary">interview with AI</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
        Realistic technical questions. Structured feedback. Better-answer examples. A personalized study plan
        that grows with you.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'lg' })}>
          Start practicing — it&apos;s free
        </Link>
        <Link href="/demo" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          View demo
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">No credit card required · Takes 5 minutes</p>
    </section>
  );
}
