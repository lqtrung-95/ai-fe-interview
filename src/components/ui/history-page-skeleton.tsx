import { Skeleton } from '@/components/ui/skeleton';
import { PageHeaderSkeleton, PanelSkeleton } from './page-skeleton-primitives';

export function HistoryPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeaderSkeleton action />
      <PanelSkeleton className="mt-8 p-4">
        <Skeleton className="mb-3 h-3 w-28" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-20 self-end" />
        </div>
      </PanelSkeleton>
      <Skeleton className="mb-3 mt-8 h-3 w-16" />
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <PanelSkeleton key={item} className="flex items-center gap-4 p-4">
            <Skeleton className="size-11 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-6 w-52" />
            </div>
            <Skeleton className="hidden h-8 w-14 sm:block" />
          </PanelSkeleton>
        ))}
      </div>
    </div>
  );
}
