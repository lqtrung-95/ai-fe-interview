'use client';

import { Printer } from 'lucide-react';

/** Triggers the browser's native print dialog (Save as PDF works from there). */
export function CheatsheetPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary print:hidden"
    >
      <Printer className="h-3.5 w-3.5" />
      Print / Save PDF
    </button>
  );
}
