import type { ResourceSearchRecord } from './resource-search-types';

/**
 * Pure client-side search over the resource index. AND semantics — every query
 * token must appear in a record's title or text. Title hits and exact-phrase
 * hits rank higher. Kept dependency-free and pure so it's unit-testable.
 */

export interface ResourceSearchResult {
  record: ResourceSearchRecord;
  snippet: string;
  score: number;
}

const SNIPPET_RADIUS = 90;
const MAX_RESULTS = 30;

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function searchResources(
  records: ResourceSearchRecord[],
  query: string,
): ResourceSearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const phrase = tokens.join(' ');

  const results: ResourceSearchResult[] = [];
  for (const record of records) {
    const titleLc = record.sectionTitle.toLowerCase();
    const textLc = record.text.toLowerCase();

    let matchedAll = true;
    let score = 0;
    for (const tok of tokens) {
      const inTitle = titleLc.includes(tok);
      const inText = textLc.includes(tok);
      if (!inTitle && !inText) {
        matchedAll = false;
        break;
      }
      if (inTitle) score += 10;
      if (inText) score += 1;
    }
    if (!matchedAll) continue;

    // Exact-phrase bonus rewards contiguous matches over scattered tokens.
    if (titleLc.includes(phrase)) score += 20;
    else if (textLc.includes(phrase)) score += 5;

    results.push({ record, snippet: buildSnippet(record.text, tokens), score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, MAX_RESULTS);
}

/** A short window of `text` centered on the earliest token match, with ellipses. */
export function buildSnippet(text: string, tokens: string[]): string {
  const lc = text.toLowerCase();
  let pos = -1;
  for (const tok of tokens) {
    const i = lc.indexOf(tok);
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  }
  if (pos === -1) return text.slice(0, SNIPPET_RADIUS * 2).trim();

  const start = Math.max(0, pos - SNIPPET_RADIUS);
  const end = Math.min(text.length, pos + SNIPPET_RADIUS);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `… ${snippet}`;
  if (end < text.length) snippet = `${snippet} …`;
  return snippet;
}
