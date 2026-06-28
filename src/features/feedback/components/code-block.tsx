import { highlightCode, isJsFence } from '@/components/common/syntax-highlight';

/**
 * Code block for the "better answer" feedback. Fenced ```lang snippets are
 * JS-highlighted via the shared tokenizer; non-JS fences render plain monospace.
 */
export function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border/50 bg-muted/60 p-3 text-xs font-mono leading-relaxed text-foreground/90">
      <code>{isJsFence(lang) ? highlightCode(code) : code}</code>
    </pre>
  );
}
