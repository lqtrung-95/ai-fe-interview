/**
 * Hand-crafted SVG diagrams for key frontend concepts.
 * All SVGs use CSS custom properties (var(--xxx)) so they adapt to
 * the app's light/dark theme automatically when inlined into the DOM.
 *
 * Each entry: { matchPattern: RegExp to find matching questions, svg: string }
 * The seeder picks the FIRST diagram whose pattern matches a question's text.
 */

export interface DiagramEntry {
  concept: string;
  /** Matches question text, subtopic, or topic */
  matchPattern: RegExp;
  svg: string;
}

// ─── Shared SVG header comment (stripped at runtime) ────────────────────────
const S = `<style>
  .dg-bg  { fill: var(--card, #fff); }
  .dg-box { fill: var(--muted, #f1f5f9); stroke: var(--border, #e2e8f0); stroke-width: 1.5; }
  .dg-accent { fill: var(--primary, #6366f1); fill-opacity: 0.12; stroke: var(--primary, #6366f1); stroke-width: 1.5; }
  .dg-label { fill: var(--foreground, #0f172a); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .dg-sub   { fill: var(--muted-foreground, #64748b); font-size: 11.5px; }
  .dg-code  { fill: var(--primary, #6366f1); font-size: 11px; font-family: monospace; }
  .dg-arr   { stroke: var(--primary, #6366f1); stroke-width: 1.5; fill: none; marker-end: url(#arr); }
  .dg-arr-m { stroke: var(--muted-foreground, #94a3b8); stroke-width: 1.2; fill: none; stroke-dasharray: 5,3; }
  .dg-badge { fill: var(--primary, #6366f1); }
  .dg-badge-text { fill: var(--primary-foreground, #fff); font-size: 10px; font-weight: 700; }
</style>
<defs>
  <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="var(--primary,#6366f1)"/>
  </marker>
</defs>`;

// ────────────────────────────────────────────────────────────────────────────
export const DIAGRAMS: DiagramEntry[] = [

  // ── 1. JavaScript Event Loop ────────────────────────────────────────────
  {
    concept: 'event-loop',
    matchPattern: /event.?loop|microtask|macrotask/i,
    svg: `<svg viewBox="0 0 620 323" width="620" height="323" xmlns="http://www.w3.org/2000/svg"
     font-family="'JetBrains Mono',ui-monospace,monospace">
<style>
  .el-cs  { fill:var(--card,#f8f7f4); stroke:var(--dg-teal,#0d7d72);    stroke-width:1.8; }
  .el-wa  { fill:var(--dg-panel,#f6f6f3); stroke:var(--dg-border,#d4d1c7); stroke-width:1.3; }
  .el-mq  { fill:var(--card,#f8f7f4); stroke:var(--dg-purple,#4f46e5);   stroke-width:1.8; }
  .el-tq  { fill:var(--card,#f8f7f4); stroke:var(--dg-orange,#b45309);   stroke-width:1.8; }
  .el-lp  { fill:var(--card,#f8f7f4); stroke:var(--dg-blue,#1d4ed8);     stroke-width:1.8; }
  .el-fr  { fill:var(--dg-panel,#f6f6f3); stroke:var(--dg-border,#d4d1c7); stroke-width:1; }
  .el-lcs { fill:var(--dg-teal,#0d7d72);    font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .el-lwa { fill:var(--dg-ink-dim,#8a8a82); font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .el-lmq { fill:var(--dg-purple,#4f46e5);  font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .el-ltq { fill:var(--dg-orange,#b45309);  font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .el-llp { fill:var(--dg-blue,#1d4ed8);    font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .el-sub { fill:var(--dg-ink-dim,#8a8a82); font-size:10px; }
  .el-frm { fill:var(--dg-ink,#41413c); font-size:10.5px; font-weight:600; }
  .el-s1  { fill:var(--dg-teal,#0d7d72);    font-size:10.5px; }
  .el-s2  { fill:var(--dg-purple,#4f46e5);  font-size:10.5px; font-weight:600; }
  .el-s3  { fill:var(--dg-orange,#b45309);  font-size:10.5px; }
  .el-s4  { fill:var(--dg-ink-dim,#8a8a82); font-size:10.5px; }
  .el-eg  { stroke:var(--dg-border-bright,#d4d1c7); stroke-width:1.3; fill:none; marker-end:url(#el-ag); }
  .el-ep  { stroke:var(--dg-purple,#4f46e5); stroke-width:1.3; fill:none; opacity:.65; marker-end:url(#el-ap); }
  .el-eb  { stroke:var(--dg-blue,#1d4ed8); stroke-width:1.5; fill:none; marker-end:url(#el-ab); }
  .el-cap { fill:var(--dg-ink-dim,#8a8a82); font-size:9.5px; }
  .el-tiny{ fill:var(--dg-ink-dim,#8a8a82); font-size:8px; }
</style>
<defs>
  <marker id="el-ag" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="var(--dg-border-bright,#d4d1c7)"/></marker>
  <marker id="el-ap" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="var(--dg-purple,#4f46e5)" opacity=".65"/></marker>
  <marker id="el-ab" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="var(--dg-blue,#1d4ed8)"/></marker>
</defs>

<!--
  Layout rationale
  ─────────────────────────────────────────────────────────────
  • Section labels (CS / WA / EL) at y=50; boxes start at y=60.
  • Blue "run callback" arc peaks at y=22 — 28 px above labels, fully clear.
  • MQ & TQ labels are drawn INSIDE their own boxes so the 31 px gap between
    WA bottom and MQ top is free for the "completes" arrow + its label.
  • "async call" label sits 11 px above its arrow midpoint (not touching it).
  • "run callback" label is at y=16 — 20 px above the arc stroke at that x.
-->

<!-- CALL STACK — spans full column height -->
<text x="70"  y="50"  text-anchor="middle" class="el-lcs">Call Stack</text>
<rect x="13"  y="60"  width="115" height="245" rx="9" class="el-cs"/>
<rect x="22"  y="168" width="97"  height="26"  rx="5" class="el-fr"/>
<text x="70"  y="185" text-anchor="middle" class="el-frm">greet()</text>
<rect x="22"  y="198" width="97"  height="26"  rx="5" class="el-fr"/>
<text x="70"  y="215" text-anchor="middle" class="el-frm">main()</text>
<text x="70"  y="290" text-anchor="middle" class="el-sub" opacity=".45">← grows up</text>

<!-- WEB APIS -->
<text x="272" y="50"  text-anchor="middle" class="el-lwa">Web APIs</text>
<rect x="193" y="60"  width="157" height="82"  rx="9" class="el-wa"/>
<text x="272" y="86"  text-anchor="middle" class="el-sub">setTimeout / setInterval</text>
<text x="272" y="103" text-anchor="middle" class="el-sub">fetch / XHR</text>
<text x="272" y="120" text-anchor="middle" class="el-sub">DOM events</text>

<!-- MICROTASK QUEUE — label inside box (top 15 px) so the gap above is free -->
<rect x="193" y="173" width="157" height="66"  rx="9" class="el-mq"/>
<text x="272" y="188" text-anchor="middle" class="el-lmq">Microtask Queue</text>
<text x="272" y="204" text-anchor="middle" class="el-sub">Promise.then · await</text>
<text x="272" y="220" text-anchor="middle" class="el-sub">queueMicrotask</text>

<!-- TASK QUEUE — label inside box (top 15 px) -->
<rect x="193" y="253" width="157" height="50"  rx="9" class="el-tq"/>
<text x="272" y="268" text-anchor="middle" class="el-ltq">Task Queue</text>
<text x="272" y="283" text-anchor="middle" class="el-sub">setTimeout · setInterval</text>
<text x="272" y="298" text-anchor="middle" class="el-sub">callbacks</text>

<!-- EVENT LOOP -->
<text x="509" y="50"  text-anchor="middle" class="el-llp">Event Loop</text>
<rect x="430" y="60"  width="157" height="170" rx="9" class="el-lp"/>
<text x="509" y="95"  text-anchor="middle" class="el-s1">① stack empty?</text>
<text x="509" y="120" text-anchor="middle" class="el-s2">② drain all microtasks</text>
<text x="509" y="145" text-anchor="middle" class="el-s3">③ run 1 macrotask</text>
<text x="509" y="170" text-anchor="middle" class="el-s4">④ render if needed</text>
<text x="509" y="196" text-anchor="middle" class="el-sub" font-size="9" opacity=".5">↻ repeat</text>

<!-- ── Arrows ── -->

<!-- ① Call Stack → Web APIs (async call)
     Arrow midpoint ≈ (165, 95). Label at y=85 sits 10 px above the stroke. -->
<path d="M128,100 C158,100 175,90 191,90" class="el-eg"/>
<text x="158" y="85" text-anchor="middle" class="el-tiny">async call</text>

<!-- ② Web APIs → Microtask Queue (completes)
     31 px gap (WA bottom 142 → MQ top 173). Label at x=260 is right of the
     arrow stroke (x=252) with 8 px horizontal clearance — nothing else here. -->
<path d="M252,144 L252,171" class="el-eg"/>
<text x="262" y="160" text-anchor="start" class="el-tiny">completes</text>

<!-- ③ Microtask Queue → Event Loop (purple — higher priority) -->
<path d="M350,206 C396,206 415,140 428,130" class="el-ep"/>

<!-- ④ Task Queue → Event Loop (gray — runs after microtasks clear) -->
<path d="M350,278 C400,278 416,198 428,188" class="el-eg"/>

<!-- ⑤ Event Loop → Call Stack (blue arc over top)
     Arc peaks at y=22, section labels at y=50 → 28 px clear above labels.
     "run callback" label at y=16 is 20 px above the arc stroke at that x,
     and appears centred over the WA column where the arc is highest. -->
<path d="M430,80 C393,22 148,22 128,76" class="el-eb"/>
<text x="280" y="16" text-anchor="middle"
      style="fill:var(--dg-blue,#1d4ed8);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:8px;font-weight:600">run callback</text>

<!-- Caption -->
<text x="310" y="318" text-anchor="middle" class="el-cap">◆ microtasks drain fully before each macrotask runs</text>
</svg>`,
  },

  // ── 2. Virtual DOM Reconciliation ───────────────────────────────────────
  {
    concept: 'virtual-dom-reconciliation',
    matchPattern: /virtual.?dom|reconcili|fiber|vdom/i,
    svg: `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Old tree -->
  <text x="150" y="28" text-anchor="middle" class="dg-label">VDOM — before</text>
  <rect x="100" y="38" width="100" height="30" rx="6" class="dg-box"/>
  <text x="150" y="58" text-anchor="middle" class="dg-sub">&lt;ul&gt;</text>
  <line x1="120" y1="68" x2="80" y2="98" class="dg-arr-m"/>
  <line x1="180" y1="68" x2="220" y2="98" class="dg-arr-m"/>
  <rect x="50" y="98" width="60" height="28" rx="4" class="dg-box"/>
  <text x="80" y="117" text-anchor="middle" class="dg-sub">A</text>
  <rect x="190" y="98" width="60" height="28" rx="4" class="dg-box"/>
  <text x="220" y="117" text-anchor="middle" class="dg-sub">B</text>

  <!-- Arrow in middle -->
  <text x="320" y="100" text-anchor="middle" class="dg-label" font-size="13">→ diff →</text>
  <line x1="280" y1="110" x2="360" y2="110" class="dg-arr"/>

  <!-- New tree -->
  <text x="490" y="28" text-anchor="middle" class="dg-label">VDOM — after</text>
  <rect x="440" y="38" width="100" height="30" rx="6" class="dg-box"/>
  <text x="490" y="58" text-anchor="middle" class="dg-sub">&lt;ul&gt;</text>
  <line x1="460" y1="68" x2="420" y2="98" class="dg-arr-m"/>
  <line x1="520" y1="68" x2="560" y2="98" class="dg-arr-m"/>
  <rect x="390" y="98" width="60" height="28" rx="4" class="dg-box"/>
  <text x="420" y="117" text-anchor="middle" class="dg-sub">A</text>
  <!-- Changed node C highlighted -->
  <rect x="530" y="98" width="60" height="28" rx="6" class="dg-accent"/>
  <text x="560" y="117" text-anchor="middle" class="dg-sub" font-weight="700">C</text>

  <!-- Callout -->
  <rect x="100" y="170" width="440" height="80" rx="10" class="dg-accent"/>
  <text x="320" y="196" text-anchor="middle" class="dg-label">React's O(n) heuristics</text>
  <text x="320" y="218" text-anchor="middle" class="dg-sub">• Different type → unmount entire subtree, rebuild from scratch</text>
  <text x="320" y="238" text-anchor="middle" class="dg-sub">• Same type → diff props, patch only what changed (B→C above)</text>
  <text x="320" y="258" text-anchor="middle" class="dg-sub">• Stable key → React tracks items across list re-renders</text>
</svg>`,
  },

  // ── 3. JavaScript Closure / Scope Chain ─────────────────────────────────
  {
    concept: 'closure-scope-chain',
    matchPattern: /closure|scope.?chain|lexical.?scope/i,
    svg: `<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Global scope -->
  <rect x="20" y="20" width="600" height="260" rx="12" class="dg-box"/>
  <text x="40" y="44" class="dg-label">Global Scope</text>
  <text x="580" y="44" text-anchor="end" class="dg-code">let x = 10</text>

  <!-- Outer function scope -->
  <rect x="50" y="60" width="540" height="190" rx="10" class="dg-accent"/>
  <text x="70" y="84" class="dg-label">outer() Scope</text>
  <text x="570" y="84" text-anchor="end" class="dg-code">let count = 0</text>

  <!-- Inner function scope -->
  <rect x="80" y="100" width="480" height="130" rx="8" style="fill:var(--primary,#6366f1);fill-opacity:.07;stroke:var(--primary,#6366f1);stroke-width:1.5"/>
  <text x="100" y="124" class="dg-label">inner() Scope  ← closure captures outer's variables</text>
  <text x="550" y="124" text-anchor="end" class="dg-code">let y = 5</text>

  <!-- Scope chain arrow -->
  <text x="300" y="160" text-anchor="middle" class="dg-sub">inner() can read: y (own) → count (outer) → x (global)</text>
  <line x1="200" y1="175" x2="440" y2="175" class="dg-arr"/>
  <text x="100" y="195" class="dg-sub" font-style="italic">own scope</text>
  <text x="270" y="195" class="dg-sub" font-style="italic">→  outer scope</text>
  <text x="440" y="195" class="dg-sub" font-style="italic">→  global</text>

  <rect x="80" y="208" width="480" height="16" rx="3" style="fill:var(--primary,#6366f1);fill-opacity:.06"/>
  <text x="300" y="220" text-anchor="middle" class="dg-sub" font-style="italic">Closure: inner() retains a reference to outer()'s variables even after outer() returns</text>
</svg>`,
  },

  // ── 4. React Component Re-render Flow ───────────────────────────────────
  {
    concept: 'react-rerender',
    matchPattern: /re.?render|when.*render|render.*trigger|component.*render/i,
    svg: `<svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Trigger -->
  <rect x="20" y="100" width="110" height="60" rx="8" class="dg-box"/>
  <text x="75" y="88" text-anchor="middle" class="dg-label">Trigger</text>
  <text x="75" y="126" text-anchor="middle" class="dg-sub">setState()</text>
  <text x="75" y="144" text-anchor="middle" class="dg-sub">new props</text>
  <line x1="132" y1="130" x2="158" y2="130" class="dg-arr"/>

  <!-- Render phase -->
  <rect x="160" y="100" width="110" height="60" rx="8" class="dg-accent"/>
  <text x="215" y="88" text-anchor="middle" class="dg-label">Render</text>
  <text x="215" y="122" text-anchor="middle" class="dg-sub">Call component</text>
  <text x="215" y="140" text-anchor="middle" class="dg-sub">function → JSX</text>
  <line x1="272" y1="130" x2="298" y2="130" class="dg-arr"/>

  <!-- Reconcile -->
  <rect x="300" y="100" width="110" height="60" rx="8" class="dg-accent"/>
  <text x="355" y="88" text-anchor="middle" class="dg-label">Reconcile</text>
  <text x="355" y="122" text-anchor="middle" class="dg-sub">Diff new VDOM</text>
  <text x="355" y="140" text-anchor="middle" class="dg-sub">vs previous</text>
  <line x1="412" y1="130" x2="438" y2="130" class="dg-arr"/>

  <!-- Commit -->
  <rect x="440" y="100" width="110" height="60" rx="8" class="dg-box"/>
  <text x="495" y="88" text-anchor="middle" class="dg-label">Commit</text>
  <text x="495" y="122" text-anchor="middle" class="dg-sub">Apply minimal</text>
  <text x="495" y="140" text-anchor="middle" class="dg-sub">DOM mutations</text>

  <!-- Bailout note -->
  <rect x="160" y="195" width="250" height="40" rx="6" style="fill:var(--primary,#6366f1);fill-opacity:.08;stroke:var(--primary,#6366f1);stroke-width:1"/>
  <text x="285" y="212" text-anchor="middle" class="dg-label" font-size="10">Bailout (skips render phase)</text>
  <text x="285" y="228" text-anchor="middle" class="dg-sub">React.memo · useMemo · useCallback · PureComponent</text>

  <!-- Annotations -->
  <text x="75" y="185" text-anchor="middle" class="dg-sub" opacity=".6">also: context, forceUpdate</text>
  <text x="495" y="185" text-anchor="middle" class="dg-sub" opacity=".6">useLayoutEffect runs here</text>
</svg>`,
  },

  // ── 5. CORS Preflight Flow ───────────────────────────────────────────────
  {
    concept: 'cors-preflight',
    matchPattern: /\bcors\b|cross.?origin|preflight|access.?control/i,
    svg: `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Browser box -->
  <rect x="20" y="60" width="130" height="160" rx="10" class="dg-accent"/>
  <text x="85" y="46" text-anchor="middle" class="dg-label">Browser</text>
  <text x="85" y="100" text-anchor="middle" class="dg-sub">app.com</text>
  <text x="85" y="120" text-anchor="middle" class="dg-sub">JS code</text>
  <text x="85" y="148" text-anchor="middle" class="dg-sub" font-style="italic">fetch("api.other.com"</text>
  <text x="85" y="164" text-anchor="middle" class="dg-sub" font-style="italic">/data")</text>

  <!-- Server box -->
  <rect x="490" y="60" width="130" height="160" rx="10" class="dg-box"/>
  <text x="555" y="46" text-anchor="middle" class="dg-label">Server</text>
  <text x="555" y="100" text-anchor="middle" class="dg-sub">api.other.com</text>

  <!-- Step 1: Preflight OPTIONS -->
  <line x1="152" y1="100" x2="488" y2="100" class="dg-arr"/>
  <rect x="240" y="78" width="160" height="18" rx="3" class="dg-badge"/>
  <text x="320" y="91" text-anchor="middle" class="dg-badge-text">① OPTIONS (preflight)</text>

  <!-- Step 2: 200 + Allow headers -->
  <line x1="488" y1="130" x2="152" y2="130" class="dg-arr" style="stroke:var(--muted-foreground,#94a3b8)"/>
  <text x="320" y="122" text-anchor="middle" class="dg-sub">② 200 + Access-Control-Allow-*</text>

  <!-- Step 3: Actual request -->
  <line x1="152" y1="170" x2="488" y2="170" class="dg-arr"/>
  <rect x="260" y="152" width="120" height="18" rx="3" class="dg-badge"/>
  <text x="320" y="165" text-anchor="middle" class="dg-badge-text">③ Actual request</text>

  <!-- Step 4: Response -->
  <line x1="488" y1="200" x2="152" y2="200" class="dg-arr" style="stroke:var(--muted-foreground,#94a3b8)"/>
  <text x="320" y="192" text-anchor="middle" class="dg-sub">④ Response data</text>

  <!-- Simple request note -->
  <rect x="150" y="235" width="340" height="34" rx="6" class="dg-box"/>
  <text x="320" y="251" text-anchor="middle" class="dg-label" font-size="10">Simple request (GET + safe headers) → skips preflight</text>
  <text x="320" y="264" text-anchor="middle" class="dg-sub">Non-simple: PUT/DELETE, custom headers, JSON body → preflight required</text>
</svg>`,
  },

  // ── 6. Critical Rendering Path ──────────────────────────────────────────
  // Redesigned with --dg-* CSS variables + JetBrains Mono for dark-mode compat.
  // viewBox 700×256: node widths sized to avoid text overflow at monospace metrics.
  // Node centers: HTML=44 DOM=133 CSSOM=230 RenderTree=337 Layout=444 Paint=535 Composite=638
  {
    concept: 'critical-rendering-path',
    matchPattern: /critical.?render|render.?pipeline|parse.*html|dom.*cssom|layout.*paint|reflow|repaint/i,
    svg: `<svg viewBox="0 0 700 256" width="700" height="256" xmlns="http://www.w3.org/2000/svg" font-family="'JetBrains Mono',ui-monospace,monospace">
  <defs>
    <marker id="arr-crp" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="var(--dg-border-bright,#d4d1c7)"/>
    </marker>
  </defs>
  <!-- Pipeline: HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite -->
  <!-- Each node: y=72 h=54 rx=9; text baseline at y=94 (label) y=112 (sublabel) -->

  <!-- HTML (neutral) -->
  <rect x="8" y="72" width="72" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-border,#d4d1c7)" stroke-width="1.5"/>
  <text x="44" y="94" text-anchor="middle" fill="var(--dg-ink,#41413c)" font-size="12" font-weight="600">HTML</text>
  <text x="44" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">bytes</text>
  <line x1="80" y1="99" x2="92" y2="99" stroke="var(--dg-border-bright,#d4d1c7)" stroke-width="1.3" marker-end="url(#arr-crp)"/>

  <!-- DOM (teal) -->
  <rect x="94" y="72" width="78" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-teal,#0d7d72)" stroke-width="1.8"/>
  <text x="133" y="94" text-anchor="middle" fill="var(--dg-teal,#0d7d72)" font-size="12" font-weight="600">DOM</text>
  <text x="133" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">parse HTML</text>
  <line x1="172" y1="99" x2="184" y2="99" stroke="var(--dg-border-bright,#d4d1c7)" stroke-width="1.3" marker-end="url(#arr-crp)"/>

  <!-- CSSOM (blue) -->
  <rect x="186" y="72" width="88" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-blue,#1d4ed8)" stroke-width="1.8"/>
  <text x="230" y="94" text-anchor="middle" fill="var(--dg-blue,#1d4ed8)" font-size="12" font-weight="600">CSSOM</text>
  <text x="230" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">parse CSS</text>
  <line x1="274" y1="99" x2="286" y2="99" stroke="var(--dg-border-bright,#d4d1c7)" stroke-width="1.3" marker-end="url(#arr-crp)"/>

  <!-- Render Tree (orange) -->
  <rect x="288" y="72" width="98" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-orange,#b45309)" stroke-width="1.8"/>
  <text x="337" y="94" text-anchor="middle" fill="var(--dg-orange,#b45309)" font-size="12" font-weight="600">Render Tree</text>
  <text x="337" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">DOM + CSSOM</text>
  <line x1="386" y1="99" x2="398" y2="99" stroke="var(--dg-border-bright,#d4d1c7)" stroke-width="1.3" marker-end="url(#arr-crp)"/>

  <!-- Layout (amber) -->
  <rect x="400" y="72" width="88" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-amber,#92400e)" stroke-width="1.8"/>
  <text x="444" y="94" text-anchor="middle" fill="var(--dg-amber,#92400e)" font-size="12" font-weight="600">Layout</text>
  <text x="444" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">positions</text>
  <line x1="488" y1="99" x2="500" y2="99" stroke="var(--dg-border-bright,#d4d1c7)" stroke-width="1.3" marker-end="url(#arr-crp)"/>

  <!-- Paint (green) -->
  <rect x="502" y="72" width="66" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-green,#15803d)" stroke-width="1.8"/>
  <text x="535" y="94" text-anchor="middle" fill="var(--dg-green,#15803d)" font-size="12" font-weight="600">Paint</text>
  <text x="535" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">pixels</text>
  <line x1="568" y1="99" x2="580" y2="99" stroke="var(--dg-border-bright,#d4d1c7)" stroke-width="1.3" marker-end="url(#arr-crp)"/>

  <!-- Composite (purple) -->
  <rect x="582" y="72" width="110" height="54" rx="9" fill="var(--card,#f8f7f4)" stroke="var(--dg-purple,#4f46e5)" stroke-width="1.8"/>
  <text x="637" y="94" text-anchor="middle" fill="var(--dg-purple,#4f46e5)" font-size="12" font-weight="600">Composite</text>
  <text x="637" y="112" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">GPU layers</text>

  <!-- Callout: Reflow (expensive) — triggers Layout + Paint + Composite -->
  <rect x="20" y="152" width="316" height="52" rx="8" fill="var(--dg-red,#b91c1c)" fill-opacity=".07" stroke="var(--dg-red,#b91c1c)" stroke-width="1.2"/>
  <text x="178" y="171" text-anchor="middle" fill="var(--dg-red,#b91c1c)" font-size="11" font-weight="700">⚠ Reflow (expensive)</text>
  <text x="178" y="189" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">width/height change → Layout + Paint + Composite</text>

  <!-- Callout: Composite Only (fast) — skips Layout + Paint -->
  <rect x="354" y="152" width="326" height="52" rx="8" fill="var(--dg-purple,#4f46e5)" fill-opacity=".07" stroke="var(--dg-purple,#4f46e5)" stroke-width="1.2"/>
  <text x="517" y="171" text-anchor="middle" fill="var(--dg-purple,#4f46e5)" font-size="11" font-weight="700">✓ Composite Only (fast)</text>
  <text x="517" y="189" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="9.5">opacity / transform → skips Layout + Paint</text>

  <!-- Caption -->
  <text x="350" y="244" text-anchor="middle" fill="var(--dg-ink-dim,#8a8a82)" font-size="10">◆ Critical Rendering Path — HTML to pixel</text>
</svg>`,
  },

  // ── 7. CSS Cascade & Specificity ────────────────────────────────────────
  {
    concept: 'css-specificity',
    matchPattern: /specificit|cascade|css.*priority|!important|selector.*weight/i,
    svg: `<svg viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Specificity pyramid tiers from bottom (lowest) to top (highest) -->
  <text x="320" y="24" text-anchor="middle" class="dg-label">CSS Specificity — higher tier always wins</text>

  <!-- Tier 0: Universal -->
  <rect x="100" y="220" width="440" height="36" rx="6" class="dg-box"/>
  <text x="180" y="243" class="dg-sub">* { }   element { }   ::pseudo-element { }</text>
  <text x="580" y="243" text-anchor="end" class="dg-code">0-0-0</text>

  <!-- Tier 1: Class -->
  <rect x="120" y="178" width="400" height="36" rx="6" class="dg-box"/>
  <text x="200" y="201" class="dg-sub">.class { }   [attr] { }   :pseudo-class { }</text>
  <text x="500" y="201" text-anchor="end" class="dg-code">0-1-0</text>

  <!-- Tier 2: ID -->
  <rect x="160" y="136" width="320" height="36" rx="6" class="dg-accent"/>
  <text x="240" y="159" class="dg-sub">#id { }</text>
  <text x="460" y="159" text-anchor="end" class="dg-code">1-0-0</text>

  <!-- Tier 3: Inline -->
  <rect x="200" y="94" width="240" height="36" rx="6" class="dg-accent"/>
  <text x="280" y="117" class="dg-sub">style="..."  (inline)</text>
  <text x="420" y="117" text-anchor="end" class="dg-code">1-0-0-0</text>

  <!-- Tier 4: !important -->
  <rect x="230" y="52" width="180" height="36" rx="6" style="fill:#ef4444;fill-opacity:.1;stroke:#ef4444;stroke-width:1.5"/>
  <text x="320" y="75" text-anchor="middle" style="fill:#ef4444;font-size:13px;font-weight:700">!important</text>

  <!-- Tiebreaker note -->
  <text x="320" y="258" text-anchor="middle" class="dg-sub" font-style="italic">Tiebreaker: source order — later rule wins within the same tier</text>
</svg>`,
  },

  // ── 8. JavaScript Promise States ────────────────────────────────────────
  {
    concept: 'promise-states',
    matchPattern: /promise.?state|promise.?chain|resolve.*reject|async.*await.*flow|then.*catch/i,
    svg: `<svg viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Pending -->
  <rect x="240" y="40" width="160" height="50" rx="8" class="dg-accent"/>
  <text x="320" y="62" text-anchor="middle" class="dg-label">Pending</text>
  <text x="320" y="80" text-anchor="middle" class="dg-sub">initial state</text>

  <!-- Fulfilled -->
  <rect x="80" y="140" width="160" height="50" rx="8" style="fill:#22c55e;fill-opacity:.1;stroke:#22c55e;stroke-width:1.5"/>
  <text x="160" y="162" text-anchor="middle" style="fill:#22c55e;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em">Fulfilled</text>
  <text x="160" y="180" text-anchor="middle" class="dg-sub">resolve(value)</text>

  <!-- Rejected -->
  <rect x="400" y="140" width="160" height="50" rx="8" style="fill:#ef4444;fill-opacity:.1;stroke:#ef4444;stroke-width:1.5"/>
  <text x="480" y="162" text-anchor="middle" style="fill:#ef4444;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em">Rejected</text>
  <text x="480" y="180" text-anchor="middle" class="dg-sub">reject(reason) / throw</text>

  <!-- Arrows -->
  <line x1="290" y1="90" x2="220" y2="138" class="dg-arr" style="stroke:#22c55e"/>
  <line x1="350" y1="90" x2="420" y2="138" class="dg-arr" style="stroke:#ef4444"/>

  <!-- Labels on arrows -->
  <text x="225" y="122" class="dg-sub" style="fill:#22c55e">resolve()</text>
  <text x="390" y="122" class="dg-sub" style="fill:#ef4444">reject()</text>

  <!-- Settled note -->
  <rect x="80" y="205" width="480" height="22" rx="6" class="dg-box"/>
  <text x="320" y="221" text-anchor="middle" class="dg-sub">Once settled (fulfilled or rejected) — state is immutable. .then() / .catch() / .finally() schedule microtasks.</text>
</svg>`,
  },

  // ── 9. Flexbox Axes ─────────────────────────────────────────────────────
  {
    concept: 'flexbox-axes',
    matchPattern: /flexbox|flex.?container|justify.?content|align.?items|flex.?direction|flex.?wrap/i,
    svg: `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Container -->
  <rect x="30" y="40" width="580" height="200" rx="10" class="dg-box"/>
  <text x="320" y="30" text-anchor="middle" class="dg-label">flex-direction: row (default)</text>

  <!-- Main axis arrow -->
  <line x1="50" y1="260" x2="590" y2="260" class="dg-arr" style="stroke:var(--primary,#6366f1)"/>
  <text x="320" y="255" text-anchor="middle" class="dg-code">main axis →  (justify-content)</text>

  <!-- Cross axis arrow -->
  <line x1="615" y1="55" x2="615" y2="230" class="dg-arr" style="stroke:var(--muted-foreground,#94a3b8)"/>
  <text x="625" y="145" text-anchor="middle" class="dg-sub" transform="rotate(90,625,145)">cross axis ↓  (align-items)</text>

  <!-- Flex items -->
  <rect x="60" y="65" width="100" height="150" rx="6" class="dg-accent"/>
  <text x="110" y="148" text-anchor="middle" class="dg-sub">item 1</text>

  <rect x="180" y="80" width="100" height="110" rx="6" class="dg-accent"/>
  <text x="230" y="138" text-anchor="middle" class="dg-sub">item 2</text>

  <rect x="300" y="90" width="100" height="90" rx="6" class="dg-accent"/>
  <text x="350" y="138" text-anchor="middle" class="dg-sub">item 3</text>

  <!-- Properties callout -->
  <rect x="430" y="65" width="160" height="150" rx="8" class="dg-box"/>
  <text x="510" y="86" text-anchor="middle" class="dg-label" font-size="10">Key properties</text>
  <text x="445" y="108" class="dg-code">justify-content</text>
  <text x="445" y="124" class="dg-sub">main axis spacing</text>
  <text x="445" y="146" class="dg-code">align-items</text>
  <text x="445" y="162" class="dg-sub">cross axis alignment</text>
  <text x="445" y="184" class="dg-code">flex-wrap</text>
  <text x="445" y="200" class="dg-sub">single / multi-line</text>
</svg>`,
  },

  // ── 10. Module Tree Shaking ──────────────────────────────────────────────
  // NOTE: removed code.?split — code-splitting is a separate concept with its own diagram
  {
    concept: 'tree-shaking',
    matchPattern: /tree.?shak|dead.?code|bundle.?optim|unused.*export/i,
    svg: `<svg viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" font-family="'JetBrains Mono',ui-monospace,monospace">${S}
  <text x="160" y="22" text-anchor="middle" class="dg-label">Before bundling</text>
  <text x="480" y="22" text-anchor="middle" class="dg-label">After tree-shaking</text>

  <!-- Before: module graph -->
  <rect x="30" y="40" width="260" height="200" rx="8" class="dg-box"/>

  <rect x="100" y="55" width="120" height="30" rx="4" class="dg-accent"/>
  <text x="160" y="75" text-anchor="middle" class="dg-sub">utils.js (exports: a, b, c, d)</text>

  <rect x="50" y="115" width="80" height="28" rx="4" class="dg-accent"/>
  <text x="90" y="134" text-anchor="middle" class="dg-sub">main.js</text>
  <text x="90" y="148" text-anchor="middle" class="dg-code">import {a}</text>

  <rect x="170" y="115" width="80" height="28" rx="4" style="fill:var(--dg-panel,#f6f6f3);stroke:var(--dg-border,#d4d1c7);stroke-width:1.5;opacity:.65"/>
  <text x="210" y="134" text-anchor="middle" class="dg-sub" opacity=".5">other.js</text>
  <text x="210" y="148" text-anchor="middle" class="dg-code" opacity=".5">import {c}</text>

  <line x1="140" y1="85" x2="90" y2="113" class="dg-arr"/>
  <line x1="180" y1="85" x2="210" y2="113" class="dg-arr-m" stroke-opacity=".4"/>

  <!-- Dead code label: shortened to fit 240px box (was overflowing at 46 chars/11px) -->
  <rect x="40" y="175" width="240" height="28" rx="4" style="fill:var(--dg-red,#b91c1c);fill-opacity:.08;stroke:var(--dg-red,#b91c1c);stroke-width:1"/>
  <text x="160" y="194" text-anchor="middle" style="fill:var(--dg-red,#b91c1c);font-size:10.5px">b, d — unused exports → dead code</text>

  <!-- Arrow between panels -->
  <line x1="302" y1="140" x2="338" y2="140" class="dg-arr"/>
  <text x="320" y="130" text-anchor="middle" class="dg-label">bundler</text>

  <!-- After: pruned bundle -->
  <rect x="350" y="40" width="270" height="200" rx="8" style="fill:var(--dg-blue,#1d4ed8);fill-opacity:.05;stroke:var(--dg-blue,#1d4ed8);stroke-width:1.5"/>
  <text x="485" y="65" text-anchor="middle" class="dg-label">Final bundle</text>

  <rect x="390" y="80" width="200" height="30" rx="4" class="dg-accent"/>
  <text x="490" y="100" text-anchor="middle" class="dg-sub">a()  →  only used export kept</text>

  <rect x="390" y="120" width="200" height="30" rx="4" class="dg-accent"/>
  <text x="490" y="140" text-anchor="middle" class="dg-sub">c()  →  only used export kept</text>

  <rect x="390" y="170" width="200" height="40" rx="4" class="dg-box"/>
  <text x="490" y="188" text-anchor="middle" style="fill:var(--dg-green,#15803d);font-size:11px;font-weight:700">b, d removed ✓</text>
  <text x="490" y="204" text-anchor="middle" class="dg-sub">Smaller bundle = faster load</text>
</svg>`,
  },

  // ── 11. React Server Components Boundary ────────────────────────────────
  {
    concept: 'react-server-components',
    matchPattern: /server.?component|rsc|client.?component|server.*client.*boundar/i,
    svg: `<svg viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Server side -->
  <rect x="10" y="30" width="290" height="220" rx="10" class="dg-box"/>
  <text x="155" y="22" text-anchor="middle" class="dg-label">Server</text>
  <text x="155" y="58" text-anchor="middle" class="dg-sub">Renders to HTML — no JS shipped</text>

  <rect x="30" y="68" width="250" height="36" rx="6" class="dg-accent"/>
  <text x="155" y="91" text-anchor="middle" class="dg-sub">Page (RSC) — reads DB, awaits data</text>

  <rect x="50" y="118" width="210" height="36" rx="6" class="dg-accent"/>
  <text x="155" y="141" text-anchor="middle" class="dg-sub">Header (RSC) — no interactivity</text>

  <rect x="50" y="168" width="210" height="36" rx="6" style="fill:#22c55e;fill-opacity:.1;stroke:#22c55e;stroke-width:1.5"/>
  <text x="155" y="191" text-anchor="middle" style="fill:#22c55e;font-size:12px">"use client" boundary</text>

  <!-- Network boundary -->
  <line x1="302" y1="30" x2="302" y2="250" stroke="var(--border,#e2e8f0)" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="320" y="148" class="dg-sub" transform="rotate(90,320,148)">network</text>

  <!-- Client side -->
  <rect x="340" y="30" width="290" height="220" rx="10" style="fill:#22c55e;fill-opacity:.06;stroke:#22c55e;stroke-width:1.5"/>
  <text x="485" y="22" text-anchor="middle" class="dg-label">Client</text>
  <text x="485" y="58" text-anchor="middle" class="dg-sub">Hydrated — JS bundle downloaded</text>

  <rect x="360" y="68" width="250" height="36" rx="6" style="fill:#22c55e;fill-opacity:.1;stroke:#22c55e;stroke-width:1.5"/>
  <text x="485" y="91" text-anchor="middle" class="dg-sub">Counter (CC) — useState, onClick</text>

  <rect x="360" y="118" width="250" height="36" rx="6" style="fill:#22c55e;fill-opacity:.1;stroke:#22c55e;stroke-width:1.5"/>
  <text x="485" y="141" text-anchor="middle" class="dg-sub">Modal (CC) — useRef, useEffect</text>

  <rect x="360" y="168" width="250" height="36" rx="6" class="dg-box"/>
  <text x="485" y="186" text-anchor="middle" class="dg-sub">RSC can pass serialisable props</text>
  <text x="485" y="200" text-anchor="middle" class="dg-sub">to CC, not functions/classes</text>
</svg>`,
  },

];
