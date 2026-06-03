import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  title: string;
  detail?: string;
  cta?: ReactNode;
}

export function InterviewEmptyState({ title, detail, cta }: Props) {
  if (cta) {
    return (
      <div className="pt-1">
        <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/75 p-5 shadow-sm shadow-background/30 sm:p-6">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{title}</p>
                {detail && <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>}
              </div>
            </div>
            <div className="shrink-0 sm:pl-4">{cta}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[22rem] items-center justify-center px-2 py-8">
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-border/70 bg-card/80 px-6 py-9 text-center shadow-sm shadow-background/30 sm:px-10">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary shadow-sm shadow-primary/10">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{title}</p>
        {detail && <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}
