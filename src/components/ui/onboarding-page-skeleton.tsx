import { Skeleton } from '@/components/ui/skeleton';
import { ChipSkeleton, PageHeaderSkeleton, PanelSkeleton } from './page-skeleton-primitives';

export function OnboardingPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <PageHeaderSkeleton />
      <div className="mt-8 space-y-8">
        {[4, 3, 4, 7].map((count, index) => (
          <section key={`${count}-${index}`} className="space-y-3">
            <Skeleton className="h-4 w-44" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: count }, (_, chip) => <ChipSkeleton key={chip} className="w-24" />)}
            </div>
          </section>
        ))}
        <PanelSkeleton className="space-y-3 p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-12 w-full" />
        </PanelSkeleton>
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
    </div>
  );
}
