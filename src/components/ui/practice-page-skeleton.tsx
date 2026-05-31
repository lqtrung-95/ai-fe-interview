import { Skeleton } from '@/components/ui/skeleton';
import { ChipSkeleton, PageHeaderSkeleton, PanelSkeleton } from './page-skeleton-primitives';

export function PracticePageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeaderSkeleton />
      <div className="mt-8 space-y-8">
        <section className="space-y-3">
          <Skeleton className="h-4 w-12" />
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <PanelSkeleton key={item} className="h-24 p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-3/4" />
              </PanelSkeleton>
            ))}
          </div>
        </section>
        <ControlRow labelWidth="w-16" chips={3} />
        <ControlRow labelWidth="w-32" chips={5} />
        <section className="space-y-4">
          <Skeleton className="h-4 w-20" />
          {[3, 1, 1, 2].map((count, index) => (
            <PanelSkeleton key={`${count}-${index}`} className="p-4">
              <Skeleton className="mb-3 h-3 w-32" />
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: count }, (_, item) => (
                  <Skeleton key={item} className="h-12 w-full" />
                ))}
              </div>
            </PanelSkeleton>
          ))}
        </section>
        <Skeleton className="ml-auto h-10 w-36" />
      </div>
    </div>
  );
}

function ControlRow({ chips, labelWidth }: { chips: number; labelWidth: string }) {
  return (
    <section className="space-y-3">
      <Skeleton className={`h-4 ${labelWidth}`} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: chips }, (_, item) => <ChipSkeleton key={item} className="h-9 w-20 rounded-lg" />)}
      </div>
    </section>
  );
}
