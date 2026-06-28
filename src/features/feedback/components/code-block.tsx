import { Fragment } from 'react';

/**
 * Lightweight JS/TS syntax highlighter for short answer snippets.
 * Deliberately dependency-free (no Shiki/Prism) — the better-answer code blocks
 * are small, well-formed JS/TS, so a compact single-pass tokenizer is enough and
 * keeps the bundle lean. Non-JS languages render as plain monospace.
 */

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'new', 'await', 'async', 'class', 'extends',
  'super', 'this', 'import', 'export', 'from', 'default', 'try', 'catch', 'finally',
  'throw', 'yield', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void', 'static',
  'get', 'set', 'as', 'interface', 'type', 'enum', 'implements', 'public', 'private',
  'protected', 'readonly',
]);
const JS_LITERALS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);

// Languages we highlight. Empty string = unlabelled fence (assume JS).
const JS_LANGS = new Set(['', 'js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript']);

type TokenType = 'comment' | 'string' | 'number' | 'ident' | 'plain';
interface Token {
  type: TokenType;
  value: string;
}

// One token per match: comment | string | number | identifier | whitespace-or-punct.
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+|[^\s\w$])/g;

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    if (m[1]) tokens.push({ type: 'comment', value: m[1] });
    else if (m[2]) tokens.push({ type: 'string', value: m[2] });
    else if (m[3]) tokens.push({ type: 'number', value: m[3] });
    else if (m[4]) tokens.push({ type: 'ident', value: m[4] });
    else tokens.push({ type: 'plain', value: m[5] ?? m[0] });
  }
  return tokens;
}

const CLASS_FOR: Record<string, string> = {
  comment: 'text-muted-foreground italic',
  string: 'text-emerald-500 dark:text-emerald-400',
  number: 'text-amber-500 dark:text-amber-400',
  keyword: 'text-violet-500 dark:text-violet-400',
  literal: 'text-orange-500 dark:text-orange-400',
  function: 'text-blue-500 dark:text-blue-400',
};

/** Next non-whitespace token after index i, or null. */
function nextNonSpace(tokens: Token[], i: number): Token | null {
  for (let j = i + 1; j < tokens.length; j++) {
    if (tokens[j].value.trim() !== '') return tokens[j];
  }
  return null;
}

function classifyIdent(value: string, tokens: Token[], i: number): string | null {
  if (JS_KEYWORDS.has(value)) return CLASS_FOR.keyword;
  if (JS_LITERALS.has(value)) return CLASS_FOR.literal;
  const next = nextNonSpace(tokens, i);
  if (next && next.value.startsWith('(')) return CLASS_FOR.function;
  return null; // plain identifier — inherit default color
}

export function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  const highlight = JS_LANGS.has(lang.toLowerCase());
  const tokens = highlight ? tokenize(code) : null;

  return (
    <pre className="overflow-x-auto rounded-md border border-border/50 bg-muted/60 p-3 text-xs font-mono leading-relaxed text-foreground/90">
      <code>
        {tokens
          ? tokens.map((t, i) => {
              const cls =
                t.type === 'ident' ? classifyIdent(t.value, tokens, i) : CLASS_FOR[t.type] ?? null;
              return cls ? (
                <span key={i} className={cls}>
                  {t.value}
                </span>
              ) : (
                <Fragment key={i}>{t.value}</Fragment>
              );
            })
          : code}
      </code>
    </pre>
  );
}
