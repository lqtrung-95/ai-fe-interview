'use client';

/**
 * Client component that renders a Mermaid diagram source string into SVG.
 * Uses mermaid.js v11 `render()` API.
 * Detects the `.dark` class on <html> to pick the right theme.
 * Gracefully hides the block if mermaid throws (invalid syntax, etc.).
 *
 * React Strict Mode runs effects twice. To avoid "duplicate ID" conflicts
 * between the two invocations we append a monotonically-incrementing sequence
 * number to the render ID. We also override mermaid.parseError so the
 * library's built-in red error toast never appears — we handle failures via
 * the promise .catch() instead.
 */

import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface Props {
  source: string;
}

// Module-level counter — unique across all concurrent renders on the page.
let _renderSeq = 0;

export function StudyDiagramMermaid({ source }: Props) {
  const uid = useId().replace(/:/g, '');
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // Track which render seq "owns" this component instance.
  const seqRef = useRef(0);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'neutral',
      flowchart: { curve: 'basis', padding: 12 },
      themeVariables: isDark
        ? { fontSize: '13px', lineColor: '#6b7280' }
        : { fontSize: '13px', lineColor: '#9ca3af' },
    });

    // Suppress Mermaid's built-in error toast — errors are handled via .catch() below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mermaid as any).parseError = () => {};

    const seq = ++_renderSeq;
    seqRef.current = seq;
    let cancelled = false;

    mermaid
      .render(`mmd-${uid}-${seq}`, source)
      .then(({ svg }) => {
        if (!cancelled && seqRef.current === seq) setSvgHtml(svg);
      })
      .catch(() => {
        if (!cancelled && seqRef.current === seq) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [source, uid]);

  if (failed) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
        Diagram
      </p>
      {svgHtml ? (
        // Source is LLM-generated Mermaid text; mermaid renders to sanitised SVG.
        // eslint-disable-next-line react/no-danger
        <div
          className="overflow-x-auto [&_svg]:h-auto [&_svg]:max-h-[22rem] [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        /* Skeleton while rendering */
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      )}
    </div>
  );
}
