/**
 * Renders a DiagramSpec JSON object into a styled inline SVG string.
 *
 * Visual design — matches the resource HTML diagrams (fe-prep-2.html style):
 *   - Warm off-white node fill (var(--card)) with colored border
 *   - Semantic color palette exactly matching the resource HTML design system
 *   - JetBrains Mono font for a technical editorial feel
 *   - Thin cubic bezier edges with small warm-gray arrowheads
 *   - Groups as dashed bounding rects with subtle fill
 *   - Caption in muted monospace below the diagram
 *   - CSS custom properties (--dg-*) for dark-mode adaptation without re-render
 */

import type { DiagramSpec, DiagramNode, DiagramColor } from './extract-seed-types';

// ── Layout constants ─────────────────────────────────────────────────────────
const NW = 130;       // node width
const NH = 44;        // node height (label only)
const NH_SUB = 60;    // node height (label + sublabel)
const H_GAP = 56;     // horizontal gap between columns (LR)
const V_GAP = 16;     // vertical gap between nodes in same column
const ROW_GAP = 52;   // vertical gap between rows (TD)
const MX = 22;        // horizontal margin
const MY = 28;        // vertical margin
const GRP_PAD = 12;   // group bounding-box inner padding
const GRP_LBL_H = 18; // height reserved above group nodes for the label

// ── Color catalog ─────────────────────────────────────────────────────────────
// Colors match the resource HTML design system exactly (fe-prep-2.html :root).
// CSS var fallbacks are the resource-HTML hardcoded values for light mode.
const COLOR_VAR: Record<DiagramColor | 'box', string> = {
  box:    'var(--dg-border,#d4d1c7)',   // warm gray — neutral, no semantic role
  teal:   'var(--dg-teal,#0d7d72)',     // --accent in resource
  green:  'var(--dg-green,#15803d)',    // --green in resource
  orange: 'var(--dg-orange,#b45309)',   // --orange in resource
  purple: 'var(--dg-purple,#4f46e5)',   // indigo in resource tok-k
  red:    'var(--dg-red,#b91c1c)',      // --red in resource
  blue:   'var(--dg-blue,#1d4ed8)',     // tok-f in resource
  pink:   'var(--dg-pink,#be185d)',     // view-model color in resource
  amber:  'var(--dg-amber,#92400e)',    // deeper amber
  cyan:   'var(--dg-cyan,#0e7490)',     // cyan-700
};

// ── Shared SVG style block ────────────────────────────────────────────────────
// Node fill = warm off-white (var(--card)) — not a tinted color fill.
// This is the key difference from the old renderer: nodes look clean & editorial.
function buildStyles(): string {
  const colorKeys = Object.keys(COLOR_VAR) as (DiagramColor | 'box')[];
  const nodeStyles = colorKeys.map(c => {
    const v = COLOR_VAR[c];
    if (c === 'box') {
      return `.n-box { fill: var(--card,#f8f7f4); stroke: ${v}; stroke-width: 1.5; }
  .t-box { fill: var(--dg-ink,#41413c); font-weight: 600; }`;
    }
    return `.n-${c} { fill: var(--card,#f8f7f4); stroke: ${v}; stroke-width: 1.8; }
  .t-${c} { fill: ${v}; font-weight: 600; }`;
  }).join('\n  ');

  return `<style>
  ${nodeStyles}
  .dg-sub   { fill: var(--dg-ink-dim,#8a8a82); font-size: 9.5px; }
  .dg-edge  { stroke: var(--dg-border-bright,#d4d1c7); stroke-width: 1.3; fill: none; marker-end: url(#arr); }
  .dg-dash  { stroke: var(--dg-border-bright,#d4d1c7); stroke-width: 1.2; fill: none; stroke-dasharray: 4,3; marker-end: url(#arr-m); }
  .dg-grp   { fill: var(--dg-panel,#f6f6f3); fill-opacity: .55; stroke: var(--dg-border,#e6e4dd); stroke-width: 1; }
  .dg-glbl  { fill: var(--dg-ink-dim,#8a8a82); font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .dg-cap   { fill: var(--dg-ink-dim,#8a8a82); font-size: 10px; }
  .dg-elbl  { fill: var(--dg-ink-dim,#8a8a82); font-size: 9px; }
</style>`;
}

const SVG_DEFS = `<defs>
  <marker id="arr"   markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="var(--dg-border-bright,#d4d1c7)"/>
  </marker>
  <marker id="arr-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="var(--dg-border-bright,#d4d1c7)" opacity=".55"/>
  </marker>
</defs>`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function nodeH(n: DiagramNode): number { return n.sublabel ? NH_SUB : NH; }
function colorKey(n: DiagramNode): DiagramColor | 'box' { return n.color ?? 'box'; }

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Longest-path depth per node (Bellman-Ford, capped at node count to handle cycles).
function computeDepths(spec: DiagramSpec): Map<string, number> {
  const d = new Map<string, number>(spec.nodes.map(n => [n.id, 0]));
  for (let i = 0; i < spec.nodes.length; i++) {
    for (const e of spec.edges) {
      const next = (d.get(e.from) ?? 0) + 1;
      if (next > (d.get(e.to) ?? 0)) d.set(e.to, next);
    }
  }
  return d;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function renderDiagramSpec(spec: DiagramSpec): string {
  const dir = spec.direction ?? 'LR';
  const depths = computeDepths(spec);
  const maxDepth = Math.max(0, ...depths.values());

  // Bucket nodes by depth level
  const buckets = new Map<number, DiagramNode[]>();
  for (let i = 0; i <= maxDepth; i++) buckets.set(i, []);
  spec.nodes.forEach(n => buckets.get(depths.get(n.id) ?? 0)!.push(n));

  const pos = new Map<string, { x: number; y: number; w: number; h: number }>();

  if (dir === 'LR') {
    const maxColH = Math.max(...[...buckets.values()].map(
      col => col.reduce((s, n) => s + nodeH(n) + V_GAP, -V_GAP),
    ), 0);
    for (let col = 0; col <= maxDepth; col++) {
      const nodes = buckets.get(col)!;
      if (!nodes.length) continue;
      const colH = nodes.reduce((s, n) => s + nodeH(n) + V_GAP, -V_GAP);
      let y = MY + GRP_LBL_H + (maxColH - colH) / 2;
      const x = MX + col * (NW + H_GAP);
      for (const n of nodes) {
        const h = nodeH(n);
        pos.set(n.id, { x, y, w: NW, h });
        y += h + V_GAP;
      }
    }
  } else {
    const maxRowW = Math.max(...[...buckets.values()].map(
      row => row.reduce((s, _) => s + NW + H_GAP, -H_GAP),
    ), 0);
    for (let row = 0; row <= maxDepth; row++) {
      const nodes = buckets.get(row)!;
      if (!nodes.length) continue;
      const rowW = nodes.reduce((s, _) => s + NW + H_GAP, -H_GAP);
      let x = MX + (maxRowW - rowW) / 2;
      const y = MY + GRP_LBL_H + row * (NH_SUB + ROW_GAP);
      for (const n of nodes) {
        pos.set(n.id, { x, y, w: NW, h: nodeH(n) });
        x += NW + H_GAP;
      }
    }
  }

  const allPos = [...pos.values()];
  const vbW = allPos.length ? Math.max(...allPos.map(p => p.x + p.w)) + MX : 200;
  const vbH = allPos.length
    ? Math.max(...allPos.map(p => p.y + p.h)) + MY + (spec.caption ? 22 : 0)
    : 100;

  const svg: string[] = [];
  // Explicit width + height let CSS max-w / max-h constrain proportionally.
  // Without them the SVG has no intrinsic size → w-full would scale it
  // to fill the container, blowing up narrow TD diagrams to thousands of px.
  const W = Math.ceil(vbW);
  const H = Math.ceil(vbH);
  svg.push(`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="'JetBrains Mono',ui-monospace,monospace">`);
  svg.push(buildStyles());
  svg.push(SVG_DEFS);

  // ── Groups (behind nodes) ────────────────────────────────────────────────────
  for (const grp of spec.groups ?? []) {
    const gpos = grp.nodeIds.map(id => pos.get(id)).filter(Boolean) as typeof allPos;
    if (!gpos.length) continue;

    const gx   = Math.min(...gpos.map(p => p.x)) - GRP_PAD;
    const gtop = Math.min(...gpos.map(p => p.y)) - GRP_PAD - GRP_LBL_H;
    const gw   = Math.max(...gpos.map(p => p.x + p.w)) - gx + GRP_PAD;
    const gh   = Math.max(...gpos.map(p => p.y + p.h)) - (gtop + GRP_LBL_H) + GRP_PAD * 2 + GRP_LBL_H;

    const ckey     = grp.color ?? null;
    const rectCls  = ckey ? `n-${ckey}` : 'dg-grp';
    const lblColor = ckey ? COLOR_VAR[ckey] : 'var(--dg-ink-dim,#8a8a82)';

    svg.push(`  <rect x="${r(gx)}" y="${r(gtop)}" width="${r(gw)}" height="${r(gh)}" rx="8" class="${rectCls}" fill-opacity=".07" stroke-dasharray="5,3"/>`);
    svg.push(`  <text x="${r(gx + 7)}" y="${r(gtop + 12)}" fill="${lblColor}" font-size="9" font-weight="700" letter-spacing=".08em">${escape(grp.label.toUpperCase())}</text>`);
  }

  // ── Edges (behind nodes) ─────────────────────────────────────────────────────
  for (const edge of spec.edges) {
    const f = pos.get(edge.from);
    const t = pos.get(edge.to);
    if (!f || !t) continue;

    let d: string;
    if (dir === 'LR') {
      const x1 = f.x + f.w, y1 = f.y + f.h / 2;
      const x2 = t.x,       y2 = t.y + t.h / 2;
      const cx = (x1 + x2) / 2;
      d = `M${r(x1)},${r(y1)} C${r(cx)},${r(y1)} ${r(cx)},${r(y2)} ${r(x2)},${r(y2)}`;
    } else {
      const x1 = f.x + f.w / 2, y1 = f.y + f.h;
      const x2 = t.x + t.w / 2, y2 = t.y;
      const cy = (y1 + y2) / 2;
      d = `M${r(x1)},${r(y1)} C${r(x1)},${r(cy)} ${r(x2)},${r(cy)} ${r(x2)},${r(y2)}`;
    }
    svg.push(`  <path d="${d}" class="${edge.dashed ? 'dg-dash' : 'dg-edge'}"/>`);

    if (edge.label) {
      const mx = dir === 'LR'
        ? (f.x + f.w + t.x) / 2
        : (f.x + f.w / 2 + t.x + t.w / 2) / 2;
      const my = dir === 'LR'
        ? Math.min(f.y, t.y) + Math.min(f.h, t.h) / 2 - 5
        : (f.y + f.h + t.y) / 2;
      svg.push(`  <text x="${r(mx)}" y="${r(my)}" text-anchor="middle" class="dg-elbl">${escape(edge.label)}</text>`);
    }
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────────
  for (const node of spec.nodes) {
    const p = pos.get(node.id);
    if (!p) continue;
    const ck = colorKey(node);

    svg.push(`  <rect x="${r(p.x)}" y="${r(p.y)}" width="${p.w}" height="${p.h}" rx="9" class="n-${ck}"/>`);

    if (node.sublabel) {
      svg.push(`  <text x="${r(p.x + p.w / 2)}" y="${r(p.y + p.h / 2 - 4)}" text-anchor="middle" class="t-${ck}" font-size="12">${escape(node.label)}</text>`);
      svg.push(`  <text x="${r(p.x + p.w / 2)}" y="${r(p.y + p.h / 2 + 12)}" text-anchor="middle" class="dg-sub">${escape(node.sublabel)}</text>`);
    } else {
      svg.push(`  <text x="${r(p.x + p.w / 2)}" y="${r(p.y + p.h / 2 + 4)}" text-anchor="middle" class="t-${ck}" font-size="12">${escape(node.label)}</text>`);
    }
  }

  // ── Caption ───────────────────────────────────────────────────────────────────
  if (spec.caption) {
    svg.push(`  <text x="${r(vbW / 2)}" y="${r(vbH - 6)}" text-anchor="middle" class="dg-cap">◆ ${escape(spec.caption)}</text>`);
  }

  svg.push('</svg>');
  return svg.join('\n');
}

// Round to 1 decimal to keep SVG output compact
function r(n: number): number { return Math.round(n * 10) / 10; }
