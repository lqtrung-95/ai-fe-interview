import { Skeleton } from '@/components/ui/skeleton';

export function CvReviewLoadingState({ message }: { message: string }) {
  return (
    <div className="space-y-5 rounded-xl border border-border/60 bg-card p-6">
      <div className="space-y-2">
        <Skeleton className="h-16 w-20 rounded-xl" />
        <p className="text-sm font-medium text-muted-foreground">
          Building your CV review
        </p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
