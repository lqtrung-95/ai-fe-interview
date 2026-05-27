import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function DashboardEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-card/50 px-8 py-20 text-center">
      <p className="text-lg font-medium">Your dashboard fills in as you practice.</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Run your first mock interview to see score trends, topic strengths, weak dimensions, and recommended next sessions.
      </p>
      <div className="mt-6">
        <Link href="/practice/new" className={buttonVariants()}>
          Start your first session
        </Link>
      </div>
    </div>
  );
}
