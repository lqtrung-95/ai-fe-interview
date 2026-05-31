import { Skeleton } from '@/components/ui/skeleton';

export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {action && <Skeleton className="h-9 w-32" />}
    </div>
  );
}

export function PanelSkeleton({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border/60 bg-card p-5 ${className}`}>
      {children}
    </div>
  );
}

export function ChipSkeleton({ className = 'w-20' }: { className?: string }) {
  return <Skeleton className={`h-7 rounded-full ${className}`} />;
}
