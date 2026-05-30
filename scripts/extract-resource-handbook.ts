/**
 * One-time extraction script: parses resources/fe-review-handbook.html,
 * translates all Vietnamese text via the shared LLM translation cache,
 * and writes src/data/resources/frontend-system-design.json.
 *
 * Run: pnpm extract-handbook
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import * as cheerio from 'cheerio';
import type { AnyNode, Cheerio, CheerioAPI } from 'cheerio';
import { translateToEnglish } from './extract-seed-llm-helpers';
import type {
  ContentBlock,
  HandbookData,
  HandbookMeta,
  HandbookSection,
  NavItem,
  PillVariant,
} from '../src/data/resources/handbook-types';

const SRC = 'resources/fe-review-handbook.html';
const OUT = 'src/data/resources/frontend-system-design.json';

// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------

/** Translate an HTML fragment — preserve <code> islands verbatim. */
async function translateHtml(html: string): Promise<string> {
  if (!html.trim()) return html;
  // Skip if purely English / already no Vietnamese
  const placeholders: string[] = [];
  // Protect <code>…</code> from translation
  const withPlaceholders = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (m) => {
    placeholders.push(m);
    return `__CODE_${placeholders.length - 1}__`;
  });
  const translated = await translateToEnglish(withPlaceholders);
  return translated.replace(/__CODE_(\d+)__/g, (_, i) => placeholders[Number(i)] ?? '');
}

/** Translate plain text (no HTML). */
async function tr(text: string): Promise<string> {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return clean;
  return translateToEnglish(clean);
}

// ---------------------------------------------------------------------------
// Strip syntax-highlight spans from <pre><code> blocks
// ---------------------------------------------------------------------------
function stripHighlightSpans(html: string): string {
  return html.replace(/<span class="tok-[^"]*">([\s\S]*?)<\/span>/g, '$1');
}

/** Decode HTML entities for plain-text extraction from cheerio */
function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// ---------------------------------------------------------------------------
// Block classifiers
// ---------------------------------------------------------------------------

async function parseCallout(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const $el = $(el);
  const cls = $el.attr('class') ?? '';
  let variant: 'tip' | 'warn' | 'key' | 'interview' = 'tip';
  if (cls.includes('warn')) variant = 'warn';
  else if (cls.includes('key')) variant = 'key';
  else if (cls.includes('interview')) variant = 'interview';

  const rawTitle = $el.find('.callout-title').text().trim();
  // Get the body: all <p> text joined (could be multiple paragraphs)
  const rawBody = $el
    .find('p')
    .map((_, p) => $(p).text().trim())
    .get()
    .join(' ');

  return {
    type: 'callout',
    variant,
    title: rawTitle ? await tr(rawTitle) : '',
    body: rawBody ? await tr(rawBody) : '',
  };
}

async function parseDiagram(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const $el = $(el);
  const rawCaption = $el.find('.diagram-cap').text().trim();
  const svgEl = $el.find('svg');
  if (!svgEl.length) return null;
  const svg = $.html(svgEl);
  const caption = rawCaption ? await tr(rawCaption) : undefined;
  return { type: 'diagram', svg, caption };
}

async function parseTable(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const $el = $(el).is('table') ? $(el) : $(el).find('table').first();
  if (!$el.length) return null;

  const headers: string[] = [];
  $el.find('thead th').each((_, th) => {
    headers.push($(th).text().trim());
  });

  const rows: string[][] = [];
  $el.find('tbody tr').each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find('td')
      .each((_, td) => {
        cells.push($(td).text().trim());
      });
    if (cells.length) rows.push(cells);
  });

  if (!headers.length && !rows.length) return null;

  const transHeaders = await Promise.all(headers.map(tr));
  const transRows = await Promise.all(
    rows.map((row) => Promise.all(row.map(tr))),
  );
  return { type: 'table', headers: transHeaders, rows: transRows };
}

async function parseQuiz(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const $el = $(el);
  const rawQ = $el.find('.quiz-q').text().trim();
  const options: string[] = [];
  let answer = 0;

  $el.find('.quiz-opt').each((idx, opt) => {
    // Strip the opt-key letter span (A, B, C, D)
    const $opt = $(opt);
    $opt.find('.opt-key').remove();
    const text = $opt.text().trim();
    options.push(text);
    if ($opt.attr('data-correct') === '1') answer = idx;
  });

  // Explanation: strip leading "Giải thích:" label and answer reference
  let rawExplain = $el.find('.quiz-explain').text().trim();
  rawExplain = rawExplain.replace(/^Giải thích:\s*/i, '').trim();
  // Remove trailing "Đáp án X." pattern
  rawExplain = rawExplain.replace(/\s*Đáp án\s+[A-Z]\.\s*$/i, '').trim();

  if (!rawQ || options.length < 2) return null;

  const [question, ...translatedOpts] = await Promise.all([
    tr(rawQ),
    ...options.map(tr),
  ]);
  const explanation = rawExplain ? await tr(rawExplain) : '';

  return {
    type: 'quiz',
    question,
    options: translatedOpts,
    answer,
    explanation,
  };
}

async function parseFlashcards(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const items: { front: string; back: string }[] = [];

  $(el)
    .find('.flashcard')
    .each((_, fc) => {
      const front = $(fc).find('.fc-q').text().trim();
      const back = $(fc).find('.fc-a').text().trim();
      if (front && back) items.push({ front, back });
    });

  if (!items.length) return null;

  const translated = await Promise.all(
    items.map(async (item) => ({
      front: await tr(item.front),
      back: await tr(item.back),
    })),
  );
  return { type: 'flashcards', items: translated };
}

async function parsePills(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const items: { text: string; variant: PillVariant }[] = [];

  $(el)
    .find('.pill')
    .each((_, pill) => {
      const cls = $(pill).attr('class') ?? '';
      let variant: PillVariant = 'neutral';
      if (cls.includes('good')) variant = 'good';
      else if (cls.includes('bad')) variant = 'bad';
      const text = $(pill).text().trim();
      if (text) items.push({ text, variant });
    });

  if (!items.length) return null;

  const translated = await Promise.all(
    items.map(async (item) => ({
      text: await tr(item.text),
      variant: item.variant,
    })),
  );
  return { type: 'pills', items: translated };
}

async function parseCards(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const items: { icon: string; title: string; body: string }[] = [];

  $(el)
    .find('.card')
    .each((_, card) => {
      const icon = $(card).find('.card-ico').text().trim();
      const title = $(card).find('h4').text().trim();
      const body = $(card).find('p').text().trim();
      if (title) items.push({ icon: icon || '•', title, body });
    });

  if (!items.length) return null;

  const translated = await Promise.all(
    items.map(async (item) => ({
      icon: item.icon,
      title: await tr(item.title),
      body: await tr(item.body),
    })),
  );
  return { type: 'cards', items: translated };
}

async function parsePre(
  $: CheerioAPI,
  el: AnyNode,
): Promise<ContentBlock | null> {
  const $el = $(el);
  const labelEl = $el.find('.code-label');
  const label = labelEl.text().trim() || undefined;
  labelEl.remove(); // remove label before extracting code

  const codeEl = $el.find('code');
  const rawCode = codeEl.length
    ? decodeEntities(stripHighlightSpans($.html(codeEl)))
        .replace(/<code[^>]*>|<\/code>/g, '')
        .trim()
    : decodeEntities(stripHighlightSpans($el.text())).trim();

  if (!rawCode) return null;
  return { type: 'pre', code: rawCode, label };
}

// ---------------------------------------------------------------------------
// Section body walker
// ---------------------------------------------------------------------------

const SKIP_CLASSES = new Set([
  'topic-head',
  'sec-foot',
  'divider-deco',
  'quiz-badge',
]);

async function walkSectionChildren(
  $: CheerioAPI,
  section: AnyNode,
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];
  const children = $(section).children().toArray();

  for (const el of children) {
    const $el = $(el);
    const tag = (el as cheerio.Element).tagName?.toLowerCase() ?? '';
    const cls = $el.attr('class') ?? '';

    // Skip decorative / structural containers
    if (SKIP_CLASSES.has(cls) || cls.startsWith('sec-foot') || cls.startsWith('topic-head')) {
      continue;
    }

    // ---- headings ----
    if (tag === 'h3') {
      const text = await tr($el.text().trim());
      if (text) blocks.push({ type: 'h3', text });
      continue;
    }
    if (tag === 'h4') {
      const text = await tr($el.text().trim());
      if (text) blocks.push({ type: 'h4', text });
      continue;
    }

    // ---- paragraphs ----
    if (tag === 'p') {
      const innerHtml = $.html($el.contents());
      const html = await translateHtml(innerHtml);
      if (html.trim()) blocks.push({ type: 'p', html: html.trim() });
      continue;
    }

    // ---- lists ----
    if (tag === 'ul') {
      const items: string[] = [];
      for (const li of $el.children('li').toArray()) {
        const text = await tr($(li).text().trim());
        if (text) items.push(text);
      }
      if (items.length) blocks.push({ type: 'ul', items });
      continue;
    }
    if (tag === 'ol') {
      const items: string[] = [];
      for (const li of $el.children('li').toArray()) {
        const text = await tr($(li).text().trim());
        if (text) items.push(text);
      }
      if (items.length) blocks.push({ type: 'ol', items });
      continue;
    }

    // ---- code blocks ----
    if (tag === 'pre') {
      const block = await parsePre($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- callouts ----
    if (cls.includes('callout')) {
      const block = await parseCallout($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- diagrams ----
    if (cls.includes('diagram')) {
      const block = await parseDiagram($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- tables (wrapped in .tbl-wrap or direct) ----
    if (cls.includes('tbl-wrap') || tag === 'table') {
      const block = await parseTable($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- quizzes ----
    if (cls.includes('quiz') && !cls.includes('quiz-opts') && !cls.includes('quiz-opt')) {
      const block = await parseQuiz($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- flashcard decks ----
    if (cls.includes('flashcards')) {
      const block = await parseFlashcards($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- pills ----
    if (cls.includes('pills')) {
      const block = await parsePills($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- cards (including two-col layouts containing .card elements) ----
    if (cls.includes('cards') || cls.includes('two-col')) {
      const block = await parseCards($, el);
      if (block) blocks.push(block);
      continue;
    }

    // ---- generic divs: recurse into children for prose content ----
    if (tag === 'div' && cls && !cls.includes('quiz')) {
      const inner = await walkSectionChildren($, el);
      blocks.push(...inner);
      continue;
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Parse nav
// ---------------------------------------------------------------------------

async function parseNav($: CheerioAPI): Promise<NavItem[]> {
  const items: NavItem[] = [];
  for (const group of $('nav .nav-group').toArray()) {
    const $group = $(group);
    const rawGroupTitle = $group.find('.nav-group-title').first().text().trim();
    const groupLabel = rawGroupTitle ? await tr(rawGroupTitle) : undefined;

    for (const a of $group.find('a').toArray()) {
      const $a = $(a);
      const href = $a.attr('href') ?? '';
      const id = href.replace('#', '');
      $a.find('.nav-ico').remove();
      const rawLabel = $a.text().trim();
      const label = rawLabel ? await tr(rawLabel) : id;
      items.push({ id, label, group: groupLabel });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Parse hero metadata
// ---------------------------------------------------------------------------

async function parseMeta($: CheerioAPI): Promise<HandbookMeta> {
  const rawTitle = $('.hero h1').text().replace(/\s+/g, ' ').trim();
  const rawDesc = $('.hero > p').first().text().trim();

  const stats: { value: string; label: string }[] = [];
  for (const stat of $('.hero-stat').toArray()) {
    const value = $(stat).find('.num').text().trim();
    const rawLabel = $(stat).find('.lbl').text().trim();
    const label = rawLabel ? await tr(rawLabel) : '';
    stats.push({ value, label });
  }

  return {
    title: rawTitle ? await tr(rawTitle) : 'Frontend System Design: A to Z',
    description: rawDesc ? await tr(rawDesc) : '',
    stats,
  };
}

// ---------------------------------------------------------------------------
// Parse all sections
// ---------------------------------------------------------------------------

async function parseSections($: CheerioAPI): Promise<HandbookSection[]> {
  const sections: HandbookSection[] = [];
  const topicEls = $('section.topic').toArray();

  console.log(`  Found ${topicEls.length} sections`);

  for (let i = 0; i < topicEls.length; i++) {
    const el = topicEls[i];
    const $el = $(el);
    const id = $el.attr('id') ?? `section-${i}`;

    const rawNum = $el.find('.topic-num').text().trim();
    const rawTitle = $el.find('.topic-head h2').text().trim();
    const rawIntro = $el.find('.topic-intro').text().trim();

    console.log(`  [${i + 1}/${topicEls.length}] ${id}`);

    const [num, title, intro] = await Promise.all([
      rawNum ? tr(rawNum) : Promise.resolve(''),
      rawTitle ? tr(rawTitle) : Promise.resolve(id),
      rawIntro ? tr(rawIntro) : Promise.resolve(''),
    ]);

    const blocks = await walkSectionChildren($, el);

    sections.push({ id, num, title, intro, blocks });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('📖 Reading source HTML...');
  const html = readFileSync(SRC, 'utf8');
  const $ = cheerio.load(html);

  console.log('🌐 Parsing nav...');
  const nav = await parseNav($);
  console.log(`  → ${nav.length} nav items`);

  console.log('🌐 Parsing hero...');
  const meta = await parseMeta($);

  console.log('🌐 Parsing sections...');
  const sections = await parseSections($);

  const data: HandbookData = { meta, nav, sections };

  console.log('💾 Writing JSON...');
  mkdirSync('src/data/resources', { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2));

  const sizeKb = Math.round(readFileSync(OUT).length / 1024);
  console.log(`✅ Done — ${OUT} (${sizeKb} KB, ${sections.length} sections)`);
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
