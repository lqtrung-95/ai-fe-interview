import { readFileSync } from 'node:fs';
import * as cheerio from 'cheerio';
import { translateToEnglish, generateQuestionsFromSection } from './extract-seed-llm-helpers';
import {
  TOPIC_ALIASES,
  type CanonicalTopic,
  type SeedQuestion,
  type Difficulty,
  type QuestionType,
} from './extract-seed-types';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function canonicalTopic(raw: string): CanonicalTopic | null {
  return TOPIC_ALIASES[raw] ?? null;
}

/**
 * Per-section topic router. Looks at heading + body keywords to redirect a
 * section away from the file's defaultTopic when a more specific topic clearly
 * fits. Falls through to defaultTopic when nothing matches.
 *
 * Order matters: most-specific signals first (Testing > Performance > Browser > React).
 */
function routeSectionTopic(args: {
  heading: string;
  body: string;
  defaultTopic: CanonicalTopic;
}): CanonicalTopic {
  const text = `${args.heading}\n${args.body}`.toLowerCase().slice(0, 2000);

  if (/\btest(s|ing)?\b|\bplaywright\b|\bvitest\b|\bjest\b|\bcypress\b|\bmsw\b|\btdd\b|\bunit test\b|\be2e\b/.test(text))
    return 'Testing';

  if (/\bperformance\b|core web vitals?|\blcp\b|\binp\b|\bcls\b|\bfid\b|\btti\b|\btbt\b|bundle (size|analysis|split)|code[- ]splitting|lazy[- ]load|tree[- ]shak|critical (rendering )?path|image optim|web ?vitals/.test(text))
    return 'Web Performance';

  if (/service worker|web worker|\bcors\b|\bcsp\b|\bcookie(s)?\b|local ?storage|session ?storage|index(ed)?db\b|web ?socket|server[- ]sent events?|\bsse\b|\bfetch api\b|\bdom\b|event (loop|propagation|delegation)|render(ing)? pipeline|browser (api|cache|render)/.test(text))
    return 'Browser & Web APIs';

  if (/\breact\b|\buseeffect\b|\buse(state|memo|callback|reducer|ref|context|transition|deferredvalue)\b|\bhooks?\b|\bjsx\b|reconciliation|virtual ?dom|\bfiber\b|server components?|\brsc\b|\bsuspense\b|\berror boundary\b/.test(text))
    return 'React';

  if (/\bjavascript\b|\bjs\b|\bclosure(s)?\b|\bpromise(s)?\b|async\/await|prototype chain|\bevent loop\b|\bmicrotask|macrotask|\bthis\b binding|\bes(6|2015|module)/.test(text))
    return 'JavaScript';

  return args.defaultTopic;
}

function normalizeLevel(raw: string): Difficulty {
  const r = raw.toLowerCase();
  if (r.includes('junior') || r.includes('beginner') || r.includes('basic') || r.includes('core'))
    return 'mid';
  if (r.includes('senior') || r.includes('advanced') || r.includes('expert')) return 'senior';
  return 'mid';
}

/**
 * fe-prep.html embeds `DATA_META = [{cat, level, q}, ...]` and `DATA_HTML_B64`
 * (parallel base64-encoded answer HTML per question). We extract both.
 *
 * Each answer HTML contains:
 *  - `.eli5`        → child-friendly explanation (Vietnamese text, stripped of label)
 *  - `.diagram svg` → SVG diagram (language-agnostic, stored as-is)
 *  - remaining body → detailed technical explanation (Vietnamese HTML → translated)
 */
export async function parseFePrep(path: string): Promise<SeedQuestion[]> {
  const html = readFileSync(path, 'utf8');
  const sourceFile = path.split('/').pop() ?? path;

  const metaMatch = html.match(/const\s+DATA_META\s*=\s*(\[[\s\S]*?\]);/);
  if (!metaMatch) return [];

  type Meta = { cat: string; level: string; q: string };
  let metas: Meta[];
  try {
    metas = JSON.parse(metaMatch[1]) as Meta[];
  } catch {
    return [];
  }

  // Extract parallel base64 answer array (single line in source).
  const b64Match = html.match(/const\s+DATA_HTML_B64\s*=\s*(\[.*?\]);/);
  let b64Array: string[] = [];
  if (b64Match) {
    try { b64Array = JSON.parse(b64Match[1]) as string[]; } catch { /* proceed without */ }
  }

  const out: SeedQuestion[] = [];
  for (const [i, m] of metas.entries()) {
    const topic = canonicalTopic(m.cat);
    if (!topic) continue;

    const questionEn = await translateToEnglish(m.q);
    const derived = await generateQuestionsFromSection({
      topic,
      heading: questionEn,
      body: `Treat the heading itself as the interview question. Generate exactly 1 question that mirrors this heading, with 3-5 expectedPoints, 1-2 followUps, difficulty ${normalizeLevel(m.level)}.`,
    });

    const first = derived[0];
    if (!first) continue;

    // ── Rich study content from base64-encoded answer HTML ───────────────────
    let childExplanation: string | undefined;
    let detailedExplanation: string | undefined;
    let diagramSvg: string | undefined;

    const rawB64 = b64Array[i];
    if (rawB64) {
      try {
        const answerHtml = Buffer.from(rawB64, 'base64').toString('utf8');
        const $a = cheerio.load(`<div id="root">${answerHtml}</div>`);

        // 1. ELI5: extract plain text (strip "🧸 Hiểu như trẻ con" label span).
        const $eli5 = $a('.eli5');
        if ($eli5.length) {
          $eli5.find('.label').remove();
          const eli5Text = $eli5.text().replace(/\s+/g, ' ').trim();
          if (eli5Text.length > 20) {
            childExplanation = await translateToEnglish(eli5Text);
          }
        }

        // 2. Diagram: extract raw SVG element from .diagram div.
        const svgEl = $a('.diagram svg');
        if (svgEl.length) {
          diagramSvg = $a.html(svgEl) ?? undefined;
        }

        // 3. Detailed body: remaining HTML minus .eli5 and .diagram.
        //    LLM translates Vietnamese text nodes while preserving HTML structure.
        $a('.eli5').remove();
        $a('.diagram').remove();
        const bodyHtml = $a('#root').html()?.trim() ?? '';
        if (bodyHtml.length > 50) {
          detailedExplanation = await translateToEnglish(bodyHtml);
        }
      } catch {
        // Non-fatal: question still gets seeded, just without rich study content.
      }
    }

    out.push({
      id: `fe-prep-${slugify(topic)}-${slugify(questionEn).slice(0, 40)}`,
      topic,
      difficulty: first.difficulty ?? normalizeLevel(m.level),
      type: first.type ?? 'conceptual',
      question: first.question || questionEn,
      expectedPoints: first.expectedPoints ?? [],
      followUps: first.followUps ?? [],
      rubric: {},
      tags: [],
      sourceFile,
      // HTML-extracted content takes precedence; LLM-generated is the fallback.
      childExplanation: childExplanation ?? first.childExplanation,
      detailedExplanation: detailedExplanation ?? first.detailedExplanation,
      // Hand-crafted SVG from HTML source takes priority; LLM-rendered spec is fallback.
      diagramSvg: diagramSvg ?? first.diagramSvg,
      quiz: first.quiz,
    });
  }
  return out;
}

/**
 * Prose-style files (fe-prep-2.html, sys-design-prep-v1.html, fun-xyz-prep.html).
 * Walks h2/h3 sections, translates to EN, asks LLM to derive 1-3 questions per section.
 * The LLM also generates `childExplanation` (ELI5) alongside each question.
 */
export async function parseProseFile(args: {
  path: string;
  defaultTopic: CanonicalTopic;
  tags?: string[];
}): Promise<SeedQuestion[]> {
  const html = readFileSync(args.path, 'utf8');
  const sourceFile = args.path.split('/').pop() ?? args.path;
  const $ = cheerio.load(html);

  const out: SeedQuestion[] = [];
  const sections = $('h2, h3').toArray();

  for (const sectionEl of sections) {
    const headingRaw = $(sectionEl).text().trim();
    if (!headingRaw || headingRaw.length < 4) continue;

    // Collect body until the next h2/h3.
    const body: string[] = [];
    let node = $(sectionEl).next();
    let depth = 0;
    while (node.length && !node.is('h2, h3') && depth < 30) {
      body.push(node.text().trim());
      node = node.next();
      depth++;
    }
    const bodyText = body.join('\n').trim();
    if (bodyText.length < 80) continue;

    // Translate heading only — the smart LLM handles VN body and outputs English.
    const headingEn = await translateToEnglish(headingRaw);
    const routedTopic = routeSectionTopic({
      heading: headingEn,
      body: bodyText,
      defaultTopic: args.defaultTopic,
    });
    const derived = await generateQuestionsFromSection({
      topic: routedTopic,
      heading: headingEn,
      body: bodyText.slice(0, 1500),
    });

    for (const q of derived) {
      if (!q.question?.trim()) continue;
      out.push({
        id: `${slugify(sourceFile.replace(/\.html$/, ''))}-${slugify(headingEn)}-${slugify(q.question).slice(0, 30)}`,
        topic: routedTopic,
        subtopic: q.subtopic ?? headingEn,
        difficulty: q.difficulty,
        type: q.type,
        question: q.question,
        expectedPoints: q.expectedPoints,
        followUps: q.followUps,
        rubric: {},
        tags: args.tags ?? [],
        sourceFile,
        childExplanation: q.childExplanation,
        detailedExplanation: q.detailedExplanation,
        diagramSvg: q.diagramSvg,
        quiz: q.quiz,
      });
    }
  }
  return out;
}
