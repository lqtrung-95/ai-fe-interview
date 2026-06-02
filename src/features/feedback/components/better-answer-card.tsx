'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mdToHtml } from '@/lib/utils';

interface Props {
  answer: string;
}

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
      {/* Split on blank lines into paragraphs; render each with inline markdown */}
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {answer.split(/\n\n+/).map((para, i) => (
          // LLM-generated content — never user input, so dangerouslySetInnerHTML is safe
          // eslint-disable-next-line react/no-danger
          <p key={i} dangerouslySetInnerHTML={{ __html: mdToHtml(para.trim()) }} />
        ))}
      </div>
    </section>
  );
}
