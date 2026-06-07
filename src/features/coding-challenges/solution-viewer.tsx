'use client';

import { useState } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import { Code2, ChevronDown } from 'lucide-react';

hljs.registerLanguage('javascript', javascript);

interface Props {
  challengeId: string;
}

export function SolutionViewer({ challengeId }: Props) {
  const [state, setState] = useState<'hidden' | 'confirm' | 'loading' | 'shown'>('hidden');
  const [solution, setSolution] = useState('');
  const [open, setOpen] = useState(true);

  async function fetchSolution() {
    setState('loading');
    try {
      const res = await fetch(`/api/coding-challenges/${challengeId}/solution`);
      const data = (await res.json()) as { solution: string };
      setSolution(data.solution);
      setState('shown');
    } catch {
      setState('confirm');
    }
  }

  if (state === 'hidden') {
    return (
      <button
        onClick={() => setState('confirm')}
        className="flex items-center gap-2 text-xs text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground transition-colors"
      >
        <Code2 className="h-3.5 w-3.5" />
        View sample solution
      </button>
    );
  }

  if (state === 'confirm') {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 space-y-2.5">
        <p className="text-xs text-muted-foreground">
          Viewing the solution before solving it on your own will reduce how much you learn. Are you sure?
        </p>
        <div className="flex gap-2">
          <button
            onClick={fetchSolution}
            className="text-xs font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            Yes, show solution
          </button>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <button
            onClick={() => setState('hidden')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Never mind
          </button>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="text-xs text-muted-foreground/60 animate-pulse">Loading solution…</div>
    );
  }

  // Shown
  const highlighted = hljs.highlight(solution, { language: 'javascript' }).value;
  const lines = highlighted.split('\n');
  const numbered = lines
    .map(
      (line, i) =>
        `<span class="hljs-line"><span class="hljs-line-num">${i + 1}</span><span class="hljs-line-content">${line}</span></span>`
    )
    .join('');

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 bg-muted/30 text-left border-b border-border/40"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Code2 className="h-3.5 w-3.5 text-primary" />
          Sample Solution
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <pre className="hljs-block m-0 rounded-none border-0">
          <code
            className="hljs language-javascript"
            dangerouslySetInnerHTML={{ __html: numbered }}
          />
        </pre>
      )}
    </div>
  );
}
