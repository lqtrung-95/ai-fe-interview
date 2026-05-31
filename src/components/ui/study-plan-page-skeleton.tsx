import { Skeleton } from '@/components/ui/skeleton';
import { PanelSkeleton } from './page-skeleton-primitives';

export function StudyPlanPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div className="flex justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-9 w-40" /><Skeleton className="h-4 w-72" /></div>
        <Skeleton className="h-8 w-20" />
      </div>
      <PanelSkeleton className="space-y-4 p-6">
        <div className="flex justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-3 w-36" /><Skeleton className="h-7 w-24" /></div>
          <div className="space-y-2"><Skeleton className="ml-auto h-8 w-14" /><Skeleton className="h-3 w-24" /></div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </PanelSkeleton>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3, 4].map((item) => (
          <PanelSkeleton key={item} className="flex items-start gap-3 p-4">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-36" /></div>
          </PanelSkeleton>
        ))}
      </div>
    </div>
  );
}
