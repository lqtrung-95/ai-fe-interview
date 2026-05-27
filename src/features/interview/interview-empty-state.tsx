import type { ReactNode } from 'react';

interface Props {
  title: string;
  detail?: string;
  cta?: ReactNode;
}

export function InterviewEmptyState({ title, detail, cta }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-card/50 px-8 py-16 text-center">
      <p className="text-lg font-medium">{title}</p>
      {detail && <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{detail}</p>}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
