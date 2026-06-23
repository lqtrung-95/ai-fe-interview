/**
 * Builds public/resources-search-index.json — a slim, plain-text index over
 * the four handbooks + glossary, fetched on demand by the client search overlay.
 *
 * Strips HTML/SVG so the index is text-only and served as a static, browser-
 * cacheable asset (no bundler involvement, no giant JSON literal in tsc).
 *
 * Run: pnpm generate:search-index
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HandbookData, ContentBlock } from '../src/data/resources/handbook-types';
import type { GlossaryData } from '../src/data/resources/glossary-types';
import type { ResourceSearchRecord } from '../src/features/resources/search/resource-search-types';

const DATA_DIR = join(process.cwd(), 'src/data/resources');
const OUT_FILE = join(process.cwd(), 'public/resources-search-index.json');

const HANDBOOKS = [
  { slug: 'javascript-core', file: 'javascript-core.json' },
  { slug: 'react-deep-dive', file: 'react-deep-dive.json' },
  { slug: 'frontend-system-design', file: 'frontend-system-design.json' },
  { slug: 'optimization-deep-dive', file: 'optimization-deep-dive.json' },
];

/** Strip HTML tags and decode the handful of entities our content uses. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract searchable plain text from one content block. Diagrams contribute caption only. */
function blockToText(block: ContentBlock): string {
  switch (block.type) {
    case 'h3':
    case 'h4':
      return block.text;
    case 'p':
      return stripHtml(block.html);
    case 'ul':
    case 'ol':
      return block.items.map(stripHtml).join(' ');
    case 'pre':
      return `${block.label ?? ''} ${block.code}`;
    case 'callout':
      return `${block.title} ${stripHtml(block.body)}`;
    case 'diagram':
      return block.caption ?? '';
    case 'table':
      return `${block.headers.join(' ')} ${block.rows.map((r) => r.join(' ')).join(' ')}`;
    case 'quiz':
      return `${block.question} ${block.options.join(' ')} ${block.explanation}`;
    case 'flashcards':
      return block.items.map((i) => `${i.front} ${i.back}`).join(' ');
    case 'pills':
      return block.items.map((i) => i.text).join(' ');
    case 'cards':
      return block.items.map((i) => `${i.title} ${i.body}`).join(' ');
    default:
      return '';
  }
}

function indexHandbook(slug: string, file: string): ResourceSearchRecord[] {
  const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8')) as HandbookData;
  const handbookTitle = data.meta.title;
  return data.sections.map((section) => {
    const body = section.blocks.map(blockToText).filter(Boolean).join(' ');
    const text = `${section.title} ${section.intro} ${body}`.replace(/\s+/g, ' ').trim();
    return {
      handbook: slug,
      handbookTitle,
      url: `/resources/${slug}#${section.id}`,
      sectionTitle: section.title,
      text,
    };
  });
}

function indexGlossary(): ResourceSearchRecord[] {
  const data = JSON.parse(readFileSync(join(DATA_DIR, 'glossary.json'), 'utf-8')) as GlossaryData;
  return data.entries.map((entry) => {
    const title = entry.abbr ? `${entry.term} (${entry.abbr})` : entry.term;
    return {
      handbook: 'glossary',
      handbookTitle: 'Glossary',
      url: '/resources/glossary',
      sectionTitle: title,
      text: `${title} ${entry.definition}`.replace(/\s+/g, ' ').trim(),
    };
  });
}

function main(): void {
  const records: ResourceSearchRecord[] = [
    ...HANDBOOKS.flatMap((h) => indexHandbook(h.slug, h.file)),
    ...indexGlossary(),
  ];
  const serialized = JSON.stringify(records);
  writeFileSync(OUT_FILE, serialized, 'utf-8');
  const bytes = Buffer.byteLength(serialized);
  console.log(
    `Wrote ${records.length} records to public/resources-search-index.json (${(bytes / 1024).toFixed(0)} KB)`,
  );
}

main();
