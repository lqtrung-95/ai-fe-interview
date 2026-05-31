import { Skeleton } from '@/components/ui/skeleton';
import { ChipSkeleton, PageHeaderSkeleton, PanelSkeleton } from './page-skeleton-primitives';

export function QuestionBankPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <PageHeaderSkeleton action />
      <div className="space-y-4">
        <Skeleton className="h-3 w-12" />
        <div className="flex flex-wrap gap-2">
          {['w-20', 'w-24', 'w-28', 'w-24', 'w-32', 'w-20', 'w-24'].map((width, index) => (
            <ChipSkeleton key={`${width}-${index}`} className={width} />
          ))}
        </div>
        <div className="flex flex-wrap gap-6">
          {[1, 2].map((group) => (
            <div key={group} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((chip) => <ChipSkeleton key={chip} className="w-16" />)}
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <PanelSkeleton key={item} className="h-44">
            <div className="flex gap-2">
              <ChipSkeleton className="w-24" />
              <ChipSkeleton className="w-14" />
            </div>
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <Skeleton className="mt-7 h-3 w-2/3" />
          </PanelSkeleton>
        ))}
      </div>
    </div>
  );
}
