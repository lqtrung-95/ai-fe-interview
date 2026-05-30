import Link from 'next/link';
import { Zap } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function DashboardEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 px-8 py-20 text-center">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Zap className="h-6 w-6" />
      </span>
      <p className="text-xl font-bold tracking-tight">Ready to level up?</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Run your first mock interview to unlock score trends, topic insights, weak-area coaching, and personalised recommendations.
      </p>
      <div className="mt-7">
        <Link href="/practice/new" className={buttonVariants({ size: 'lg' })}>
          Start your first session
        </Link>
      </div>
    </div>
  );
}
