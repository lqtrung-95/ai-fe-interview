'use client';

import { useMemo } from 'react';
import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import { HintsPanel } from './hints-panel';
import { SolutionViewer } from './solution-viewer';
import type { ChallengePublic } from './types';

// Build a readable vitest-style assertion for a visible test case
function buildTestCode(input: string, expected: string | undefined): string {
  if (!expected) return '';

  const matcher = (() => {
    try {
      const val = JSON.parse(expected);
      return typeof val === 'object' && val !== null
        ? `toEqual(${expected})`
        : `toBe(${expected})`;
    } catch {
      return `toBe(${expected})`;
    }
  })();

  const isComplex =
    input.startsWith('(()') ||
    input.startsWith('(function') ||
    (input.includes('=>') && !input.startsWith('(solution'));

  const expr = isComplex ? input : `solution${input}`;

  // For long expressions, put .matcher on its own line
  const oneLiner = `expect(${expr}).${matcher}`;
  if (oneLiner.length <= 72) return oneLiner;
  return `expect(\n  ${expr}\n).${matcher}`;
}

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('ts', typescript);

const DIFFICULTY_STYLES: Record<string, string> = {
  junior: 'bg-green-500/10 text-green-600 dark:text-green-400',
  mid: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  senior: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

// Custom marked renderer with syntax highlighting + numbered code blocks
const renderer = new marked.Renderer();

renderer.code = ({ text, lang }: Tokens.Code) => {
  const validLang = lang && hljs.getLanguage(lang) ? lang : 'javascript';
  const highlighted = hljs.highlight(text.trimEnd(), { language: validLang }).value;
  const lines = highlighted.split('\n');
  // Join with '' not '\n' — the <pre> context renders '\n' between spans as visible blank lines
  const numbered = lines
    .map(
      (line, i) =>
        `<span class="hljs-line"><span class="hljs-line-num">${i + 1}</span><span class="hljs-line-content">${line}</span></span>`
    )
    .join('');
  return `<pre class="hljs-block"><code class="hljs language-${validLang}">${numbered}</code></pre>`;
};

renderer.codespan = ({ text }: Tokens.Codespan) =>
  `<code class="challenge-inline-code">${text}</code>`;

renderer.heading = ({ text, depth }: Tokens.Heading) => {
  const tag = `h${depth}`;
  return `<${tag} class="challenge-heading">${text}</${tag}>`;
};

marked.use({ renderer });

interface Props {
  challenge: ChallengePublic;
}

export function ChallengeDescription({ challenge }: Props) {
  const html = useMemo(() => marked.parse(challenge.description) as string, [challenge.description]);
  const visibleCases = challenge.testCases.filter((tc) => !tc.isHidden);
  const hiddenCount = challenge.testCases.length - visibleCases.length;

  return (
    <div className="space-y-5 overflow-y-auto p-5">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[challenge.difficulty] ?? ''}`}>
          {challenge.difficulty}
        </span>
        <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
          {challenge.topic}
        </span>
      </div>

      <h1 className="text-xl font-bold tracking-tight">{challenge.title}</h1>

      {/* Description — rendered markdown with syntax highlighting */}
      <div className="challenge-prose" dangerouslySetInnerHTML={{ __html: html }} />

      {/* Visible test cases */}
      {visibleCases.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Test Cases ({visibleCases.length} visible{hiddenCount > 0 ? `, ${hiddenCount} hidden` : ''})
          </p>
          <div className="space-y-2">
            {visibleCases.map((tc) => {
              const code = buildTestCode(tc.input, tc.expected);
              const codeHtml = code
                ? hljs.highlight(code, { language: 'javascript' }).value
                : '';
              return (
                <div key={tc.id} className="rounded-lg border border-border/60 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30 text-xs font-medium text-foreground border-b border-border/40">
                    {tc.label}
                  </div>
                  {codeHtml && (
                    <pre className="hljs-block-inline m-0 border-0 rounded-none">
                      <code
                        className="hljs"
                        style={{ fontSize: '0.75rem', padding: '0.625rem 0.875rem' }}
                        dangerouslySetInnerHTML={{ __html: codeHtml }}
                      />
                    </pre>
                  )}
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <p className="text-xs text-muted-foreground/60 pl-1">
                + {hiddenCount} hidden test{hiddenCount > 1 ? 's' : ''} run on submit
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hints — progressive reveal */}
      {challenge.hints.length > 0 && <HintsPanel hints={challenge.hints} />}

      {/* Sample solution — gated behind a confirmation click */}
      <SolutionViewer challengeId={challenge.id} />
    </div>
  );
}
