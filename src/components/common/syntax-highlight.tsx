import { Fragment, type ReactNode } from 'react';

/**
 * Lightweight, dependency-free JS/TS syntax highlighter for short code snippets.
 * Deliberately avoids Shiki/Prism (megabytes of grammars) — snippets here are
 * small and well-formed, so a compact single-pass tokenizer is enough.
 *
 * Two callers, two language-gating strategies:
 *  - Feedback "better answer": clean ```lang fences → allow-list (isJsFence).
 *  - Handbook code blocks: free-form labels (e.g. "React lazy") → highlight JS
 *    by default, skip only clearly non-JS languages (isJsLabel).
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

// Clean fence markers that mean "JS/TS" (empty = unlabelled fence, assume JS).
const JS_FENCE_LANGS = new Set(['', 'js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript']);

// Handbook labels are descriptive, not language codes, so we highlight as JS
// unless the label clearly names a non-JS language.
const NON_JS_LABEL_RE =
  /(\bcss\b|\bhtml\b|\bjson\b|\bhttp\b|server config|\bbash\b|\bshell\b|\bsql\b|\byaml\b|\bgraphql\b|dockerfile|nginx|\bxml\b)/i;

/** True when a ```lang fence should be JS-highlighted. */
export function isJsFence(lang = ''): boolean {
  return JS_FENCE_LANGS.has(lang.toLowerCase());
}

/** True when a free-form handbook label should be JS-highlighted (default yes). */
export function isJsLabel(label = ''): boolean {
  return !NON_JS_LABEL_RE.test(label);
}

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

type Palette = Record<'comment' | 'string' | 'number' | 'keyword' | 'literal' | 'function', string>;

// Theme-aware palette — for backgrounds that flip with light/dark mode (feedback).
const PALETTE_AUTO: Palette = {
  comment: 'text-muted-foreground italic',
  string: 'text-emerald-500 dark:text-emerald-400',
  number: 'text-amber-500 dark:text-amber-400',
  keyword: 'text-violet-500 dark:text-violet-400',
  literal: 'text-orange-500 dark:text-orange-400',
  function: 'text-blue-500 dark:text-blue-400',
};

// Always-bright palette — for the handbook's hardcoded dark code box (#0d1117).
const PALETTE_DARK: Palette = {
  comment: 'text-slate-500 italic',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  keyword: 'text-violet-400',
  literal: 'text-orange-400',
  function: 'text-sky-400',
};

/** Next non-whitespace token after index i, or null. */
function nextNonSpace(tokens: Token[], i: number): Token | null {
  for (let j = i + 1; j < tokens.length; j++) {
    if (tokens[j].value.trim() !== '') return tokens[j];
  }
  return null;
}

function classifyIdent(value: string, tokens: Token[], i: number, palette: Palette): string | null {
  if (JS_KEYWORDS.has(value)) return palette.keyword;
  if (JS_LITERALS.has(value)) return palette.literal;
  const next = nextNonSpace(tokens, i);
  if (next && next.value.startsWith('(')) return palette.function;
  return null; // plain identifier — inherit default color
}

/**
 * Tokenize JS/TS `code` and return colored React nodes.
 * `onDark` selects the always-bright palette for permanently-dark backgrounds.
 */
export function highlightCode(code: string, opts: { onDark?: boolean } = {}): ReactNode {
  const palette = opts.onDark ? PALETTE_DARK : PALETTE_AUTO;
  const tokens = tokenize(code);
  return tokens.map((t, i) => {
    const cls =
      t.type === 'ident'
        ? classifyIdent(t.value, tokens, i, palette)
        : t.type === 'plain'
          ? null
          : palette[t.type];
    return cls ? (
      <span key={i} className={cls}>
        {t.value}
      </span>
    ) : (
      <Fragment key={i}>{t.value}</Fragment>
    );
  });
}
