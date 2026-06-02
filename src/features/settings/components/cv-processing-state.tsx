import { FileSearch, FileUp, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ProcessingStatus = 'uploading' | 'parsing' | 'deleting';

const CONTENT = {
  uploading: {
    icon: FileUp,
    title: 'Uploading your CV',
    detail: 'Securely sending your file before we extract your experience.',
  },
  parsing: {
    icon: FileSearch,
    title: 'Analysing your CV',
    detail: 'Extracting roles, skills, and project highlights for personalised practice.',
  },
  deleting: {
    icon: Trash2,
    title: 'Removing your CV',
    detail: 'Clearing the uploaded file and its parsed profile from your account.',
  },
} satisfies Record<ProcessingStatus, { icon: typeof FileUp; title: string; detail: string }>;

export function CvProcessingState({ status }: { status: ProcessingStatus }) {
  const content = CONTENT[status];
  const Icon = content.icon;

  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.035]">
      <div className="h-1 overflow-hidden bg-primary/10">
        <div className="h-full w-2/3 animate-pulse rounded-r-full bg-primary/70" />
      </div>
      <div className="flex flex-col items-center px-6 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5 animate-pulse" />
        </span>
        <p className="mt-4 text-sm font-semibold">{content.title}</p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
          {content.detail}
        </p>
      </div>
      <div className="grid gap-2 border-t border-border/50 bg-background/20 p-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-12 rounded-lg" />)}
      </div>
    </div>
  );
}
