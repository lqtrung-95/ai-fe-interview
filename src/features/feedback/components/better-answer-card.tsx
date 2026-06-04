'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  answer: string;
}

const HIGHLIGHT_PATTERN =
  /(React Profiler|Performance panel|commit durations|wasted renders|INP|long-task trace|long tasks|React render time|JavaScript execution|layout thrash|main-thread blocking|third-party script|startTransition|useDeferredValue|useCallback|ref-based handlers|virtualization|splitting state|high-frequency updates|React\.memo|useMemo|Memoization|measurement|measured|measure|classify|targeted fix|verify)/gi;
const HIGHLIGHT_TEST_PATTERN =
  /^(React Profiler|Performance panel|commit durations|wasted renders|INP|long-task trace|long tasks|React render time|JavaScript execution|layout thrash|main-thread blocking|third-party script|startTransition|useDeferredValue|useCallback|ref-based handlers|virtualization|splitting state|high-frequency updates|React\.memo|useMemo|Memoization|measurement|measured|measure|classify|targeted fix|verify)$/i;

export function BetterAnswerCard({ answer }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in non-HTTPS or restrictive contexts; no-op.
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-border/70 bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Better answer</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAnswer}
          aria-label={copied ? 'Copied to clipboard' : 'Copy better answer'}
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              <span className="ml-1.5 text-xs">Copied</span>
            </>
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
      <div className="space-y-3 text-sm leading-7 text-foreground/80">
        {answer.split(/\n\n+/).map((para, i) => (
          <p key={i}>{renderHighlightedAnswer(para.trim())}</p>
        ))}
      </div>
    </section>
  );
}

function renderHighlightedAnswer(text: string) {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      // Backtick terms → highlighted pill (primary style going forward)
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <mark
            key={index}
            className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary dark:bg-primary/15 not-italic"
          >
            {part.slice(1, -1)}
          </mark>
        );
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }

      // Hardcoded keyword pattern — fallback for older answers without backtick formatting
      return highlightKeywords(part, index);
    });
}

function highlightKeywords(text: string, keyPrefix: number) {
  return text
    .split(HIGHLIGHT_PATTERN)
    .filter(Boolean)
    .map((part, index) =>
      HIGHLIGHT_TEST_PATTERN.test(part) ? (
        <mark
          key={`${keyPrefix}-${index}`}
          className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary dark:bg-primary/15"
        >
          {part}
        </mark>
      ) : (
        <span key={`${keyPrefix}-${index}`}>{part}</span>
      ),
    );
}
