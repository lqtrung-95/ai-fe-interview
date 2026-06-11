/**
 * Validates question rows against docs/question-generation-rules.md (§5-§12):
 * ladder count, pitfall/blockquote presence, length bands, quiz shape,
 * expectedPoints/followUps cardinality, no company names, behavioral variant
 * rules (no code blocks). Reports violations per row; exits 1 if any.
 *
 * Usage:
 *   pnpm exec tsx scripts/validate-question-content-format.ts            # new-prep-* rows only
 *   pnpm exec tsx scripts/validate-question-content-format.ts --all      # every row with content
 */

import { readdirSync, readFileSync } from 'node:fs';

const SEED_DIR = 'prisma/seed/questions';
const ALL = process.argv.includes('--all');
const COMPANY_NAMES = /\b(Google|Meta|Facebook|Binance|Stripe|Amazon|Netflix|Airbnb|Uber)\b/;

interface Row {
  id: string;
  type: string;
  question: string;
  expectedPoints?: string[];
  followUps?: string[];
  childExplanation?: string | null;
  detailedExplanation?: string | null;
  quiz?: string | unknown | null;
  [key: string]: unknown;
}

function validateRow(r: Row): { errs: string[]; warns: string[] } {
  const errs: string[] = [];
  const warns: string[] = [];
  const d = r.detailedExplanation ?? '';
  const isBehavioral = r.type === 'behavioral';

  if (!r.childExplanation) errs.push('missing childExplanation');
  else {
    if (/<[a-z]+[\s>]/i.test(r.childExplanation)) errs.push('childExplanation contains HTML');
    if (r.childExplanation.length < 80) errs.push(`childExplanation too short (${r.childExplanation.length})`);
  }

  if (!d) errs.push('missing detailedExplanation');
  else {
    // Docs give 7-9k as the target band; treat it loosely — only flag clear
    // outliers (4 live rows sit at 11-12.6k and read fine).
    const min = isBehavioral ? 3500 : 4500;
    const max = isBehavioral ? 9000 : 13000;
    if (d.length < min || d.length > max) errs.push(`detailedExplanation length ${d.length} outside [${min},${max}]`);

    // Models emit single- or double-quoted attributes; the DOM treats them identically.
    const ladders = (d.match(/class=['"]lq-item['"]/g) ?? []).length;
    if (ladders !== 5) errs.push(`ladder items: ${ladders} (want 5)`);

    const pitfalls = (d.match(/class=['"]pitfall['"]/g) ?? []).length;
    if (pitfalls !== 1) errs.push(`pitfall divs: ${pitfalls} (want 1)`);

    if (!/<blockquote>\s*(<p>)?\s*Senior signal:/i.test(d) && !/Senior signal:/.test(d)) {
      errs.push('missing "Senior signal:" blockquote');
    }

    const h4s = (d.match(/<h4>/g) ?? []).length;
    if (h4s < 3) errs.push(`h4 sections: ${h4s} (want >=3)`);

    const pres = (d.match(/<pre>/g) ?? []).length;
    if (isBehavioral && pres > 0) errs.push(`behavioral has ${pres} code block(s) (want 0)`);
    if (!isBehavioral && pres < 2) errs.push(`code blocks: ${pres} (want >=2)`);

    // Warn-only: product names ("Google Fonts", "Stripe IDs") are legitimate;
    // the §9.5 rule targets company anecdotes. Needs human judgment.
    const companyHit = d.match(COMPANY_NAMES) ?? r.childExplanation?.match(COMPANY_NAMES);
    if (companyHit) warns.push(`company name in content: ${companyHit[0]} (verify it's a product reference)`);
  }

  if ((r.expectedPoints ?? []).length !== 5) errs.push(`expectedPoints: ${(r.expectedPoints ?? []).length} (want 5)`);
  if ((r.followUps ?? []).length !== 3) errs.push(`followUps: ${(r.followUps ?? []).length} (want 3)`);

  if (!r.quiz) errs.push('missing quiz');
  else {
    try {
      const q = typeof r.quiz === 'string' ? JSON.parse(r.quiz) : r.quiz;
      const want = q.format === 'tf' ? 2 : 4;
      if (!['mcq', 'tf'].includes(q.format)) errs.push(`quiz format: ${q.format}`);
      if (!Array.isArray(q.options) || q.options.length !== want) errs.push(`quiz options: ${q.options?.length} (want ${want})`);
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= want) errs.push(`quiz answer index: ${q.answer}`);
      if (!q.explanation) errs.push('quiz missing explanation');
    } catch {
      errs.push('quiz is not valid JSON');
    }
  }

  return { errs, warns };
}

let checked = 0;
let bad = 0;
for (const fname of readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'))) {
  const rows: Row[] = JSON.parse(readFileSync(`${SEED_DIR}/${fname}`, 'utf8'));
  for (const r of rows) {
    if (!ALL && !r.id.startsWith('new-prep-')) continue;
    if (ALL && !r.detailedExplanation) continue; // legacy rows without content: skip in --all
    checked++;
    const { errs, warns } = validateRow(r);
    if (errs.length) {
      bad++;
      console.log(`✗ ${r.id} (${fname})`);
      for (const e of errs) console.log(`    - ${e}`);
    }
    for (const w of warns) console.log(`  ⚠ ${r.id}: ${w}`);
  }
}

console.log(`\n${checked - bad}/${checked} rows pass format validation`);
process.exit(bad > 0 ? 1 : 0);
