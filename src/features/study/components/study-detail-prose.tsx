'use client';

import { useEffect, useRef } from 'react';
import { marked } from 'marked';

/**
 * Renders detailedExplanation which can be HTML, Markdown, or mixed LLM output.
 * Client component so ladder (Deep Dive) answer toggles are interactive.
 *
 * Rendering pipeline:
 *   - marked.parse normalises Markdown/HTML/mixed LLM output into HTML
 *   - Cleanup strips fe-prep.html artifacts (embedded li numbers)
 *   - Unwrap pitfall/ladder divs accidentally fenced in <pre><code> by the LLM
 *
 * Content originates from our own seed (not user input), so
 * dangerouslySetInnerHTML is safe. Styles live in globals.css → .study-prose.
 *
 * Ladder toggle: uses event delegation — one click listener on the container
 * routes all .lq-toggle button clicks, toggling the answer panel hidden attr.
 */

interface Props {
  html: string;
}

export function StudyDetailProse({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // marked.parse is synchronous when no async walker is configured.
  let rendered = marked.parse(html) as string;

  // Strip embedded numbers in <li> from fe-prep.html extraction artifacts:
  // "1Why does..." → "Why does..."
  rendered = rendered.replace(/(<li[^>]*>)\s*\d+\.?\s*/g, '$1');

  // LLM sometimes wraps pitfall/ladder divs in <pre><code> instead of emitting
  // structural HTML. Unwrap both raw and entity-encoded forms.
  rendered = rendered.replace(
    /<pre[^>]*><code[^>]*>\s*(<div\s[^>]*class="(?:pitfall|ladder)[^"]*"[\s\S]*?<\/div>)\s*<\/code><\/pre>/gi,
    '$1',
  );
  rendered = rendered.replace(
    /<pre[^>]*><code[^>]*>\s*(&lt;div\s[^&]*class=(?:&quot;|')(?:pitfall|ladder)[^&]*(?:&quot;|')[\s\S]*?&lt;\/div&gt;)\s*<\/code><\/pre>/gi,
    (_, inner: string) =>
      inner
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleClick(e: MouseEvent) {
      const btn = (e.target as Element).closest<HTMLButtonElement>('.lq-toggle');
      if (!btn) return;
      const targetId = btn.dataset.target;
      const ans = targetId ? el!.querySelector<HTMLElement>(`#${targetId}`) : null;
      if (!ans) return;
      const opening = ans.hidden;
      ans.hidden = !opening;
      btn.setAttribute('aria-expanded', String(opening));
    }

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="study-prose"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
