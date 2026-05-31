import { Skeleton } from '@/components/ui/skeleton';
import { ChipSkeleton, PanelSkeleton } from './page-skeleton-primitives';

export function SettingsPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-52" />
      </div>
      <PanelSkeleton className="space-y-5 p-6">
        <Skeleton className="h-5 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-48" /></div>
        </div>
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-9 w-28" />
      </PanelSkeleton>
      <PanelSkeleton className="space-y-5 p-6">
        <div className="flex gap-3"><Skeleton className="size-10" /><Skeleton className="h-5 w-44" /></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full" />)}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-5">
          {[1, 2, 3, 4, 5].map((item) => <ChipSkeleton key={item} className="w-24" />)}
        </div>
      </PanelSkeleton>
      <PanelSkeleton className="space-y-5 p-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-96 max-w-full" />
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 w-full" />)}
      </PanelSkeleton>
    </div>
  );
}
