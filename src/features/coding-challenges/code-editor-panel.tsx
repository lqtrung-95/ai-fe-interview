'use client';

import { RotateCcw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ResilientCodeEditor } from './resilient-code-editor';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function CodeEditorPanel({ value, onChange, onReset, isSubmitting, onSubmit }: Props) {
  return (
    <div className="flex h-full flex-col">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">JavaScript</span>
        <button
          onClick={onReset}
          className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' gap-1.5 text-xs'}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Editor (falls back to a textarea if Monaco fails) */}
      <div className="min-h-0 flex-1">
        <ResilientCodeEditor value={value} onChange={onChange} ariaLabel="JavaScript solution" />
      </div>

      {/* Submit */}
      <div className="border-t border-border/60 p-3">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={buttonVariants({ className: 'app-primary-button w-full' })}
        >
          {isSubmitting ? 'Running…' : 'Run & Submit'}
        </button>
      </div>
    </div>
  );
}
