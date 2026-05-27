import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function LandingHero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
      <Badge variant="secondary" className="mb-6">
        Built for senior frontend interviews
      </Badge>
      <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
        Practice Frontend Interviews with an AI Coach
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
        Realistic technical questions. Structured feedback. Better-answer examples. A personalized study plan
        that grows with you.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'lg' })}>
          Start Practicing
        </Link>
        <Link href="/demo" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          View Demo
        </Link>
      </div>
    </section>
  );
}
