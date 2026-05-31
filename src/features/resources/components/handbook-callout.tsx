/**
 * Renders tip / warn / key / interview callout blocks from the handbook JSON.
 * Server component — no client state needed.
 */

import { Lightbulb, AlertTriangle, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalloutVariant } from '@/data/resources/handbook-types';

interface Props {
  variant: CalloutVariant;
  title: string;
  body: string;
}

type StyleEntry = {
  Icon: React.ComponentType<{ className?: string }>;
  borderCls: string;
  iconCls: string;
  titleCls: string;
  bgCls: string;
};

const STYLES: Record<CalloutVariant, StyleEntry> = {
  tip: {
    Icon: Lightbulb,
    borderCls: 'border-l-emerald-500',
    iconCls: 'text-emerald-500',
    titleCls: 'text-emerald-700 dark:text-emerald-400',
    bgCls: 'bg-emerald-500/5',
  },
  warn: {
    Icon: AlertTriangle,
    borderCls: 'border-l-amber-500',
    iconCls: 'text-amber-500',
    titleCls: 'text-amber-700 dark:text-amber-400',
    bgCls: 'bg-amber-500/5',
  },
  key: {
    Icon: Zap,
    borderCls: 'border-l-primary',
    iconCls: 'text-primary',
    titleCls: 'text-primary',
    bgCls: 'bg-primary/5',
  },
  interview: {
    Icon: MessageSquare,
    borderCls: 'border-l-border',
    iconCls: 'text-muted-foreground',
    titleCls: 'text-foreground',
    bgCls: 'bg-muted/40',
  },
};

export function HandbookCallout({ variant, title, body }: Props) {
  const { Icon, borderCls, iconCls, titleCls, bgCls } = STYLES[variant];
  return (
    <div
      className={cn(
        'rounded-r-lg border-l-[3px] px-5 py-4 space-y-1.5 my-5',
        borderCls,
        bgCls,
      )}
    >
      {title && (
        <div className={cn('flex items-center gap-2 text-sm font-semibold', titleCls)}>
          <Icon className={cn('h-3.5 w-3.5 shrink-0', iconCls)} />
          {title}
        </div>
      )}
      {/* body may contain inline HTML from LLM generation (e.g. <code>, <strong>) — safe since
          content comes from our own scripts, never user input */}
      {/* eslint-disable-next-line react/no-danger */}
      <p className="handbook-inline-html text-sm text-muted-foreground leading-relaxed pl-[1.375rem]" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
