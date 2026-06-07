import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      {/* Left panel skeleton */}
      <div className="w-full space-y-4 border-b border-border/60 p-5 md:w-1/2 md:border-b-0 md:border-r">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      {/* Right panel skeleton */}
      <div className="w-full flex-1 bg-[#1e1e1e]/50 md:w-1/2" />
    </div>
  );
}
