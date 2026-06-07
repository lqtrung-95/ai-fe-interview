'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { RotateCcw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

// Lazy load Monaco — ~2MB bundle, only needed on the workspace page
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function CodeEditorPanel({ value, onChange, onReset, isSubmitting, onSubmit }: Props) {
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

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

      {/* Monaco */}
      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          language="javascript"
          theme={monacoTheme}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
          }}
        />
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
