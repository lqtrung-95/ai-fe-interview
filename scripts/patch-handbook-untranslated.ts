/**
 * Patches src/data/resources/frontend-system-design.json to translate
 * any remaining Vietnamese text that the initial extraction missed:
 *   - Flashcard front/back strings
 *   - SVG <text>/<tspan> node content
 *   - Code block comment lines (// and # style)
 *   - Callout body / paragraph html (rare cases)
 *   - Removes the spurious LLM system-prompt block that leaked into the data
 *
 * Uses the same translateToEnglish() cache as the extraction script, so
 * already-translated strings cost zero extra API calls.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { translateToEnglish } from './extract-seed-llm-helpers';

// Matches any Vietnamese diacritic character (tones + đ)
const VIET_RE =
  /[àáảãạăắặằẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẶẰẲẴÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;

const hasViet = (s: string) => VIET_RE.test(s);

// ─── SVG patch ────────────────────────────────────────────────────────────────
// Extracts text content from SVG >text< nodes, translates Vietnamese ones,
// and substitutes back while preserving the SVG structure.
async function patchSvgText(svg: string): Promise<string> {
  // Match text content between > and < (no nested tags — matches leaf text nodes)
  const TEXT_NODE_RE = />([^<>]+)</g;
  const toTranslate = new Map<string, string>(); // original → translated

  let m: RegExpExecArray | null;
  while ((m = TEXT_NODE_RE.exec(svg)) !== null) {
    const raw = m[1];
    if (hasViet(raw) && !toTranslate.has(raw)) {
      const trimmed = raw.trim();
      if (trimmed) toTranslate.set(raw, ''); // placeholder
    }
  }

  // Translate collected strings (sequential to respect rate limits)
  for (const [raw] of toTranslate) {
    const translated = await translateToEnglish(raw.trim());
    // Preserve leading/trailing whitespace so the SVG replacement is exact
    const prefix = raw.match(/^\s*/)?.[0] ?? '';
    const suffix = raw.match(/\s*$/)?.[0] ?? '';
    toTranslate.set(raw, prefix + translated + suffix);
  }

  // Apply all replacements in one pass
  let result = svg;
  for (const [original, translated] of toTranslate) {
    if (translated && translated !== original) {
      result = result.split(original).join(translated);
    }
  }
  return result;
}

// ─── Code comment / string patch ─────────────────────────────────────────────
// Handles: // comments, # comments, /* */ comments, <!-- --> HTML comments,
// and single/double-quoted string literals containing Vietnamese.
async function patchCodeComments(code: string): Promise<string> {
  const lines = code.split('\n');
  const patched: string[] = [];

  for (const line of lines) {
    if (!hasViet(line)) { patched.push(line); continue; }

    // Full-line // comment
    const jsLine = line.match(/^(\s*\/\/)(.+)$/);
    if (jsLine && hasViet(jsLine[2])) {
      const t = await translateToEnglish(jsLine[2].trim());
      patched.push(`${jsLine[1]} ${t}`); continue;
    }

    // Full-line # comment
    const shLine = line.match(/^(\s*#)(.+)$/);
    if (shLine && hasViet(shLine[2])) {
      const t = await translateToEnglish(shLine[2].trim());
      patched.push(`${shLine[1]} ${t}`); continue;
    }

    // /* ... */ CSS/JS block comment on a single line
    const cssComment = line.match(/^(\s*\/\*)(.+?)(\*\/)(.*)$/);
    if (cssComment && hasViet(cssComment[2])) {
      const t = await translateToEnglish(cssComment[2].trim());
      patched.push(`${cssComment[1]} ${t} ${cssComment[3]}${cssComment[4]}`); continue;
    }

    // <!-- ... --> HTML comment on a single line
    const htmlComment = line.match(/^(\s*<!--)(.+?)(-->)(.*)$/);
    if (htmlComment && hasViet(htmlComment[2])) {
      const t = await translateToEnglish(htmlComment[2].trim());
      patched.push(`${htmlComment[1]} ${t} ${htmlComment[3]}${htmlComment[4]}`); continue;
    }

    // Trailing inline comment: code  // Vietnamese
    const inline = line.match(/^(.+?)(\s*\/\/)(.+)$/);
    if (inline && hasViet(inline[3])) {
      const t = await translateToEnglish(inline[3].trim());
      patched.push(`${inline[1]}${inline[2]} ${t}`); continue;
    }

    // Quoted string value containing Vietnamese: 'text' or "text"
    // Replace each quoted Vietnamese token while leaving surrounding code intact
    let result = line;
    const quotedRe = /(['"])([^'"]*[àáảãạăắặằẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẶẰẲẴÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][^'"]*)(\1)/g;
    let qm: RegExpExecArray | null;
    const replacements: Array<{from: string; to: string}> = [];
    while ((qm = quotedRe.exec(line)) !== null) {
      const inner = qm[2];
      const translated = await translateToEnglish(inner);
      if (translated !== inner) replacements.push({ from: qm[0], to: `${qm[1]}${translated}${qm[3]}` });
    }
    for (const { from, to } of replacements) result = result.split(from).join(to);
    patched.push(result);
  }

  return patched.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const filePath = join(process.cwd(), 'src/data/resources/frontend-system-design.json');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = JSON.parse(readFileSync(filePath, 'utf-8')) as any;

  let fixCount = 0;

  for (const section of data.sections) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleaned: any[] = [];

    for (const block of section.blocks) {
      // Remove spurious LLM system-prompt block that leaked into the extraction
      if (
        block.type === 'p' &&
        typeof block.html === 'string' &&
        block.html.includes('Here are a few examples of how Vietnamese')
      ) {
        console.log(`  [removed] system-prompt leak in §${section.id}`);
        fixCount++;
        continue;
      }

      // Flashcard fronts / backs
      if (block.type === 'flashcards') {
        for (const item of block.items) {
          if (hasViet(item.front)) {
            console.log(`  [flashcard front] §${section.id}: ${item.front.slice(0, 50)}…`);
            item.front = await translateToEnglish(item.front);
            fixCount++;
          }
          if (hasViet(item.back)) {
            console.log(`  [flashcard back] §${section.id}`);
            item.back = await translateToEnglish(item.back);
            fixCount++;
          }
        }
      }

      // SVG diagram text nodes
      if (block.type === 'diagram' && hasViet(block.svg)) {
        console.log(`  [svg] §${section.id}`);
        block.svg = await patchSvgText(block.svg);
        fixCount++;
      }

      // Code block comments
      if (block.type === 'pre' && hasViet(block.code)) {
        console.log(`  [code] §${section.id}`);
        block.code = await patchCodeComments(block.code);
        fixCount++;
      }

      // Callout body
      if (block.type === 'callout' && hasViet(block.body)) {
        block.body = await translateToEnglish(block.body);
        fixCount++;
      }

      // Paragraph HTML (rare — most p blocks were translated in extraction)
      if (block.type === 'p' && hasViet(block.html)) {
        block.html = await translateToEnglish(block.html);
        fixCount++;
      }

      cleaned.push(block);
    }

    section.blocks = cleaned;
  }

  console.log(`\n✅ Patched ${fixCount} items`);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved — ${filePath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
