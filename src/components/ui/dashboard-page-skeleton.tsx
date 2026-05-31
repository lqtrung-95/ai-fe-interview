import { Skeleton } from '@/components/ui/skeleton';
import { PageHeaderSkeleton, PanelSkeleton } from './page-skeleton-primitives';

export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <PageHeaderSkeleton action />
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <PanelSkeleton key={item}>
              <div className="flex justify-between gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-7" />
              </div>
              <Skeleton className="mt-4 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-24" />
            </PanelSkeleton>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <PanelSkeleton key={item} className="h-72">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mx-auto mt-8 h-44 w-[85%]" />
            </PanelSkeleton>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <PanelSkeleton key={item} className="h-80">
              <div className="flex items-center gap-3">
                <Skeleton className="size-7" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="mt-5 space-y-2">
                {[1, 2, 3].map((row) => <Skeleton key={row} className="h-16 w-full" />)}
              </div>
            </PanelSkeleton>
          ))}
        </div>
      </div>
    </div>
  );
}
