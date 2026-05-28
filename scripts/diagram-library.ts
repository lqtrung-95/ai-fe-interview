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
    svg: `<svg viewBox="0 0 640 290" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Call Stack -->
  <rect x="20" y="50" width="130" height="210" rx="8" class="dg-accent"/>
  <text x="85" y="38" text-anchor="middle" class="dg-label">Call Stack</text>
  <rect x="30" y="160" width="110" height="28" rx="4" class="dg-box"/>
  <text x="85" y="179" text-anchor="middle" class="dg-sub">greet()</text>
  <rect x="30" y="192" width="110" height="28" rx="4" class="dg-box"/>
  <text x="85" y="211" text-anchor="middle" class="dg-sub">main()</text>
  <text x="85" y="245" text-anchor="middle" class="dg-sub" opacity=".45">← grows up</text>

  <!-- Web APIs box -->
  <rect x="250" y="50" width="140" height="100" rx="8" class="dg-box"/>
  <text x="320" y="38" text-anchor="middle" class="dg-label">Web APIs</text>
  <text x="320" y="82" text-anchor="middle" class="dg-sub">setTimeout / setInterval</text>
  <text x="320" y="102" text-anchor="middle" class="dg-sub">fetch / XHR</text>
  <text x="320" y="122" text-anchor="middle" class="dg-sub">DOM events</text>

  <!-- Microtask Queue -->
  <rect x="250" y="175" width="140" height="42" rx="8" class="dg-accent"/>
  <text x="320" y="166" text-anchor="middle" class="dg-label">Microtask Queue</text>
  <text x="320" y="202" text-anchor="middle" class="dg-code">Promise.then · await · queueMicrotask</text>

  <!-- Task Queue -->
  <rect x="250" y="238" width="140" height="36" rx="8" class="dg-box"/>
  <text x="320" y="229" text-anchor="middle" class="dg-label">Task Queue</text>
  <text x="320" y="262" text-anchor="middle" class="dg-sub">setTimeout callbacks</text>

  <!-- Event Loop -->
  <rect x="460" y="120" width="155" height="100" rx="8" class="dg-accent"/>
  <text x="537" y="108" text-anchor="middle" class="dg-label">Event Loop</text>
  <text x="537" y="148" text-anchor="middle" class="dg-sub">① Stack empty?</text>
  <text x="537" y="168" text-anchor="middle" class="dg-sub">② Drain microtasks</text>
  <text x="537" y="188" text-anchor="middle" class="dg-sub">③ Run 1 task</text>
  <text x="537" y="208" text-anchor="middle" class="dg-sub">④ Render if needed</text>

  <!-- Arrows -->
  <line x1="320" y1="152" x2="320" y2="173" class="dg-arr"/>
  <line x1="320" y1="219" x2="320" y2="236" class="dg-arr"/>
  <line x1="458" y1="170" x2="154" y2="190" class="dg-arr-m"/>
  <text x="306" y="142" text-anchor="middle" class="dg-sub" font-size="9">completes</text>
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
  {
    concept: 'critical-rendering-path',
    matchPattern: /critical.?render|render.?pipeline|parse.*html|dom.*cssom|layout.*paint|reflow|repaint/i,
    svg: `<svg viewBox="0 0 640 240" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <!-- Pipeline steps: HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite -->
  <!-- HTML -->
  <rect x="10" y="80" width="72" height="44" rx="6" class="dg-box"/>
  <text x="46" y="97" text-anchor="middle" class="dg-label" font-size="10">HTML</text>
  <text x="46" y="114" text-anchor="middle" class="dg-sub">bytes</text>
  <line x1="84" y1="102" x2="98" y2="102" class="dg-arr"/>

  <!-- DOM -->
  <rect x="100" y="80" width="72" height="44" rx="6" class="dg-accent"/>
  <text x="136" y="97" text-anchor="middle" class="dg-label" font-size="10">DOM</text>
  <text x="136" y="114" text-anchor="middle" class="dg-sub">parse HTML</text>
  <line x1="174" y1="102" x2="188" y2="102" class="dg-arr"/>

  <!-- CSSOM -->
  <rect x="190" y="80" width="72" height="44" rx="6" class="dg-accent"/>
  <text x="226" y="97" text-anchor="middle" class="dg-label" font-size="10">CSSOM</text>
  <text x="226" y="114" text-anchor="middle" class="dg-sub">parse CSS</text>
  <line x1="264" y1="102" x2="278" y2="102" class="dg-arr"/>

  <!-- Render Tree -->
  <rect x="280" y="80" width="82" height="44" rx="6" class="dg-accent"/>
  <text x="321" y="97" text-anchor="middle" class="dg-label" font-size="10">Render Tree</text>
  <text x="321" y="114" text-anchor="middle" class="dg-sub">DOM + CSSOM</text>
  <line x1="364" y1="102" x2="378" y2="102" class="dg-arr"/>

  <!-- Layout -->
  <rect x="380" y="80" width="72" height="44" rx="6" class="dg-box"/>
  <text x="416" y="97" text-anchor="middle" class="dg-label" font-size="10">Layout</text>
  <text x="416" y="114" text-anchor="middle" class="dg-sub">positions</text>
  <line x1="454" y1="102" x2="468" y2="102" class="dg-arr"/>

  <!-- Paint -->
  <rect x="470" y="80" width="72" height="44" rx="6" class="dg-box"/>
  <text x="506" y="97" text-anchor="middle" class="dg-label" font-size="10">Paint</text>
  <text x="506" y="114" text-anchor="middle" class="dg-sub">pixels</text>
  <line x1="544" y1="102" x2="558" y2="102" class="dg-arr"/>

  <!-- Composite -->
  <rect x="560" y="80" width="72" height="44" rx="6" class="dg-box"/>
  <text x="596" y="97" text-anchor="middle" class="dg-label" font-size="10">Composite</text>
  <text x="596" y="114" text-anchor="middle" class="dg-sub">GPU layers</text>

  <!-- Reflow / Repaint callouts -->
  <rect x="50" y="168" width="220" height="50" rx="8" style="fill:#ef4444;fill-opacity:.08;stroke:#ef4444;stroke-width:1.2"/>
  <text x="160" y="186" text-anchor="middle" style="fill:#ef4444;font-size:11px;font-weight:700">⚠ Reflow (expensive)</text>
  <text x="160" y="204" text-anchor="middle" class="dg-sub">width/height change → Layout + Paint + Composite</text>

  <rect x="310" y="168" width="200" height="50" rx="8" style="fill:var(--primary,#6366f1);fill-opacity:.08;stroke:var(--primary,#6366f1);stroke-width:1.2"/>
  <text x="410" y="186" text-anchor="middle" class="dg-label" font-size="10">✓ Composite only (fast)</text>
  <text x="410" y="204" text-anchor="middle" class="dg-sub">opacity / transform → skips Layout + Paint</text>
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
  {
    concept: 'tree-shaking',
    matchPattern: /tree.?shak|dead.?code|bundle.?optim|code.?split|unused.*export/i,
    svg: `<svg viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${S}
  <text x="160" y="22" text-anchor="middle" class="dg-label">Before bundling</text>
  <text x="480" y="22" text-anchor="middle" class="dg-label">After tree-shaking</text>

  <!-- Before: module graph -->
  <rect x="30" y="40" width="260" height="200" rx="8" class="dg-box"/>

  <rect x="100" y="55" width="120" height="30" rx="4" class="dg-accent"/>
  <text x="160" y="75" text-anchor="middle" class="dg-sub">utils.js (exports: a, b, c, d)</text>

  <rect x="50" y="115" width="80" height="28" rx="4" class="dg-accent"/>
  <text x="90" y="134" text-anchor="middle" class="dg-sub">main.js</text>
  <text x="90" y="148" text-anchor="middle" class="dg-code">import {a}</text>

  <rect x="170" y="115" width="80" height="28" rx="4" style="fill:#94a3b8;fill-opacity:.15;stroke:#94a3b8;stroke-width:1.5"/>
  <text x="210" y="134" text-anchor="middle" class="dg-sub" opacity=".5">other.js</text>
  <text x="210" y="148" text-anchor="middle" class="dg-code" opacity=".5">import {c}</text>

  <line x1="140" y1="85" x2="90" y2="113" class="dg-arr"/>
  <line x1="180" y1="85" x2="210" y2="113" class="dg-arr-m" stroke-opacity=".4"/>

  <rect x="40" y="175" width="240" height="28" rx="4" style="fill:#ef4444;fill-opacity:.08;stroke:#ef4444;stroke-width:1"/>
  <text x="160" y="194" text-anchor="middle" style="fill:#ef4444;font-size:11px">b, d — exported but never imported → dead code</text>

  <!-- Arrow between -->
  <line x1="302" y1="140" x2="338" y2="140" class="dg-arr"/>
  <text x="320" y="130" text-anchor="middle" class="dg-label" font-size="10">bundler</text>

  <!-- After: pruned bundle -->
  <rect x="350" y="40" width="270" height="200" rx="8" style="fill:var(--primary,#6366f1);fill-opacity:.06;stroke:var(--primary,#6366f1);stroke-width:1.5"/>
  <text x="485" y="65" text-anchor="middle" class="dg-label" font-size="10">Final bundle</text>

  <rect x="390" y="80" width="200" height="30" rx="4" class="dg-accent"/>
  <text x="490" y="100" text-anchor="middle" class="dg-sub">a()  →  only used export kept</text>

  <rect x="390" y="120" width="200" height="30" rx="4" class="dg-accent"/>
  <text x="490" y="140" text-anchor="middle" class="dg-sub">c()  →  only used export kept</text>

  <rect x="390" y="170" width="200" height="40" rx="4" class="dg-box"/>
  <text x="490" y="188" text-anchor="middle" style="fill:#22c55e;font-size:11px;font-weight:700">b, d removed ✓</text>
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
