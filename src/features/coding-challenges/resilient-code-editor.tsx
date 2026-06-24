'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import { useTheme } from 'next-themes';

// Lazy load Monaco — ~2MB bundle, only needed on a workspace page.
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
  language?: string;
  ariaLabel?: string;
}

/**
 * Code editor that never takes the page down with it. If Monaco fails to
 * initialise (CDN/runtime issue), the error boundary swaps in a plain textarea
 * so the user can still read the challenge and write a solution. The original
 * error is logged so the root cause stays visible.
 */
export function ResilientCodeEditor({ value, onChange, language = 'javascript', ariaLabel }: Props) {
  const { resolvedTheme } = useTheme();

  const fallback = (
    <textarea
      aria-label={ariaLabel ?? 'Code editor'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="h-full w-full resize-none border-0 bg-card p-4 font-mono text-sm leading-relaxed text-foreground outline-none"
    />
  );

  return (
    <EditorErrorBoundary fallback={fallback}>
      <MonacoEditor
        height="100%"
        language={language}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        // JSX/TS squiggles add no value in a sandbox — silence them. Guarded so a
        // Monaco API shape change can't throw out of the mount callback.
        onMount={(_editor, monaco) => {
          try {
            monaco.languages.typescript?.javascriptDefaults?.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true,
            });
          } catch {
            /* non-fatal */
          }
        }}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
        }}
      />
    </EditorErrorBoundary>
  );
}

class EditorErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Surface the real cause; the user still gets the textarea fallback.
    console.error('[code-editor] editor failed, falling back to textarea:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
