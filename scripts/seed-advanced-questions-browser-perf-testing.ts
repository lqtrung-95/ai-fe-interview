/**
 * Advanced seed batch — Part 2: Browser (4) + Performance (3) + Testing (3)
 * Usage: pnpm tsx scripts/seed-advanced-questions-browser-perf-testing.ts
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { renderDiagramSpec } from './diagram-spec-renderer';
import type { DiagramSpec } from './extract-seed-types';

loadEnv({ path: '.env.local' });

function upsertJson(filePath: string, questions: object[]) {
  const existing: { id: string }[] = JSON.parse(readFileSync(filePath, 'utf8'));
  const ids = new Set(questions.map((q: any) => q.id));
  const merged = [...existing.filter((q) => !ids.has(q.id)), ...questions];
  writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  return merged.length;
}

/* ── Diagram specs ── */

const WORKERS_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'main',     label: 'Main Thread',        sublabel: 'UI · events · React · DOM',           color: 'teal'   },
    { id: 'post_out', label: 'postMessage(data)',   sublabel: 'structured clone or Transferable',    color: 'blue'   },
    { id: 'worker',   label: 'Worker Thread',       sublabel: 'no DOM · CPU-heavy computation',      color: 'purple' },
    { id: 'post_back',label: 'postMessage(result)', sublabel: 'result returned to main thread',      color: 'green'  },
    { id: 'offscreen',label: 'OffscreenCanvas',     sublabel: 'GPU render in worker · zero jank',    color: 'orange' },
  ],
  edges: [
    { from: 'main',     to: 'post_out'  },
    { from: 'post_out', to: 'worker'    },
    { from: 'worker',   to: 'post_back' },
    { from: 'worker',   to: 'offscreen', dashed: true },
  ],
  caption: 'Transferable objects (ArrayBuffer) avoid cloning cost · OffscreenCanvas moves GPU work off main thread',
};

const FLIP_SPEC: DiagramSpec = {
  direction: 'TD',
  nodes: [
    { id: 'first',   label: 'First',                sublabel: 'getBoundingClientRect() · record start', color: 'teal'   },
    { id: 'last',    label: 'Last',                 sublabel: 'apply final state · measure end pos',    color: 'blue'   },
    { id: 'invert',  label: 'Invert',               sublabel: 'CSS transform to look like First',       color: 'orange' },
    { id: 'play',    label: 'Play',                 sublabel: 'transition transform → identity(0,0,1)', color: 'green'  },
    { id: 'vt',      label: 'View Transitions API', sublabel: 'startViewTransition() — FLIP built-in',  color: 'purple' },
  ],
  edges: [
    { from: 'first',  to: 'last'   },
    { from: 'last',   to: 'invert' },
    { from: 'invert', to: 'play'   },
    { from: 'play',   to: 'vt',  dashed: true },
  ],
  caption: 'read First → read Last → invert with transform → play to identity · no layout thrashing',
};

const BFCACHE_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'nav',    label: 'Navigate Away',  sublabel: 'pagehide event fires',                         color: 'teal'   },
    { id: 'freeze', label: 'Page Frozen',    sublabel: 'stored in bfcache',                            color: 'blue'   },
    { id: 'back',   label: 'User goes Back', sublabel: 'browser checks bfcache',                       color: 'orange' },
    { id: 'hit',    label: 'bfcache Hit',    sublabel: 'instant restore · pageshow e.persisted=true',  color: 'green'  },
    { id: 'miss',   label: 'bfcache Miss',   sublabel: 'full reload · unload/open-IDB/no-store',       color: 'red'    },
  ],
  edges: [
    { from: 'nav',    to: 'freeze' },
    { from: 'freeze', to: 'back'   },
    { from: 'back',   to: 'hit'    },
    { from: 'back',   to: 'miss',  dashed: true },
  ],
  caption: 'unload event handlers are the #1 bfcache killer · replace with pagehide + visibilitychange',
};

const WASM_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'src',     label: 'Rust / C++',     sublabel: 'native performance-critical code',          color: 'orange' },
    { id: 'compile', label: 'wasm-pack / emcc',sublabel: 'compile → .wasm + JS bindings',            color: 'blue'   },
    { id: 'module',  label: '.wasm Module',    sublabel: 'binary · streamed compile',                 color: 'purple' },
    { id: 'glue',    label: 'JS Bindings',     sublabel: 'WebAssembly.instantiateStreaming()',         color: 'teal'   },
    { id: 'react',   label: 'React Component', sublabel: 'import and call WASM fn directly',          color: 'green'  },
  ],
  edges: [
    { from: 'src',     to: 'compile' },
    { from: 'compile', to: 'module'  },
    { from: 'compile', to: 'glue',   dashed: true },
    { from: 'module',  to: 'glue'    },
    { from: 'glue',    to: 'react'   },
  ],
  caption: 'use WASM for CPU-heavy work (image/audio/crypto/simulation) · avoid for DOM manipulation',
};

const INP_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'input', label: 'User Interaction',   sublabel: 'click · keydown · pointerup',           color: 'teal'   },
    { id: 'id',    label: 'Input Delay',         sublabel: 'main thread busy · target ≤50ms',       color: 'red'    },
    { id: 'pt',    label: 'Processing Time',     sublabel: 'event handlers execute',                color: 'orange' },
    { id: 'pd',    label: 'Presentation Delay',  sublabel: 'render + paint frame',                  color: 'blue'   },
    { id: 'inp',   label: 'INP Score',           sublabel: '75th %ile · Good < 200ms',              color: 'green'  },
  ],
  edges: [
    { from: 'input', to: 'id'  },
    { from: 'id',    to: 'pt'  },
    { from: 'pt',    to: 'pd'  },
    { from: 'pd',    to: 'inp' },
  ],
  caption: 'INP = input delay + processing + presentation · replaced FID (first-only) in March 2024',
};

const PRIO_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'html',  label: 'HTML Parser',        sublabel: 'discovers resources in document',       color: 'teal'   },
    { id: 'queue', label: 'Priority Queue',      sublabel: 'Critical · High · Medium · Low',        color: 'blue'   },
    { id: 'high',  label: 'fetchpriority=high',  sublabel: 'LCP image · hero CSS link',             color: 'green'  },
    { id: 'low',   label: 'fetchpriority=low',   sublabel: 'below-fold images · analytics',         color: 'orange' },
    { id: 'lcp',   label: 'Better LCP',          sublabel: 'hero image loads first in queue',       color: 'purple' },
  ],
  edges: [
    { from: 'html',  to: 'queue' },
    { from: 'queue', to: 'high'  },
    { from: 'queue', to: 'low'   },
    { from: 'high',  to: 'lcp'   },
  ],
  caption: 'fetchpriority changes queue position · does not change when to fetch, only relative order',
};

const SPEC_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'rules',    label: 'Speculation Rules',  sublabel: '<script type="speculationrules">',       color: 'teal'   },
    { id: 'prefetch', label: 'prefetch mode',       sublabel: 'network only · no JS · safe',           color: 'blue'   },
    { id: 'prerender',label: 'prerender mode',      sublabel: 'full page + JS in background',          color: 'purple' },
    { id: 'nav',      label: 'Instant Navigation',  sublabel: 'swap in pre-rendered page <100ms',      color: 'green'  },
    { id: 'risk',     label: 'Risks',               sublabel: 'double analytics · mutations · 100MB',  color: 'red'    },
  ],
  edges: [
    { from: 'rules',    to: 'prefetch'  },
    { from: 'rules',    to: 'prerender' },
    { from: 'prerender',to: 'nav'       },
    { from: 'prerender',to: 'risk',     dashed: true },
  ],
  caption: 'prefetch = network only (safe) · prerender = full execution (fast but watch for side effects)',
};

const MSW_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'test',    label: 'Test Suite',    sublabel: 'real fetch()',          color: 'teal'   },
    { id: 'sw',      label: 'MSW Layer',     sublabel: 'network intercept',     color: 'purple' },
    { id: 'handler', label: 'Handler',       sublabel: 'http.get("/api/…")',    color: 'orange' },
    { id: 'res',     label: 'Mock Response', sublabel: 'HttpResponse.json({})', color: 'green'  },
  ],
  edges: [
    { from: 'test',    to: 'sw'      },
    { from: 'sw',      to: 'handler' },
    { from: 'handler', to: 'res'     },
  ],
  caption: 'no jest.mock · real HTTP layer executes · identical in browser and Node.js',
};

const AXE_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'comp',   label: 'Component',       sublabel: 'rendered in DOM',                          color: 'teal'   },
    { id: 'axe',    label: 'axe.run()',        sublabel: 'WCAG 2.1 A / AA rules',                   color: 'blue'   },
    { id: 'auto',   label: 'Auto (~35%)',      sublabel: 'contrast · labels · alt · ARIA roles',    color: 'green'  },
    { id: 'manual', label: 'Manual (~65%)',    sublabel: 'focus flow · reading order · context',    color: 'orange' },
    { id: 'ci',     label: 'CI Gate',          sublabel: 'toHaveNoViolations() fails PR',            color: 'purple' },
  ],
  edges: [
    { from: 'comp',  to: 'axe'    },
    { from: 'axe',   to: 'auto'   },
    { from: 'axe',   to: 'manual', dashed: true },
    { from: 'auto',  to: 'ci'     },
  ],
  caption: 'automated tests catch ~35% of WCAG issues · always pair with keyboard + screen reader testing',
};

const LHCI_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'pr',      label: 'Pull Request',     sublabel: 'code change proposed',                   color: 'teal'   },
    { id: 'ci',      label: 'LHCI Run',         sublabel: 'lhci autorun · N runs · median',         color: 'blue'   },
    { id: 'budgets', label: 'Budget Assertions', sublabel: 'LCP · INP · CLS · TBT thresholds',      color: 'orange' },
    { id: 'compare', label: 'vs Baseline',       sublabel: 'delta check ±10%',                      color: 'purple' },
    { id: 'gate',    label: 'PR Gate',           sublabel: 'pass · warn · fail',                    color: 'green'  },
  ],
  edges: [
    { from: 'pr',      to: 'ci'      },
    { from: 'ci',      to: 'budgets' },
    { from: 'budgets', to: 'compare' },
    { from: 'compare', to: 'gate'    },
  ],
  caption: 'run on same infra every time · TBT is lab proxy for INP · block on "Good" threshold breach',
};

/* ── Question builder ── */
function buildQuestions(svgs: Record<string, string>) {
  return [
    /* ─── Browser 1: Web Workers & OffscreenCanvas ──────────────── */
    {
      id: 'custom-browser-web-workers-offscreencanvas-offload-heavy-computation',
      topic: 'Browser & Web APIs', subtopic: 'Web Workers & OffscreenCanvas',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How do Web Workers offload computation from the main thread, what data can be transferred efficiently with Transferable objects, and when is OffscreenCanvas beneficial?',
      expectedPoints: [
        'new Worker(url) creates a background thread; it has no access to the DOM, window, or document — only Web APIs like fetch, IndexedDB, and timers',
        'postMessage() sends data by structured clone (copies) by default; passing Transferable objects (ArrayBuffer, ImageBitmap, MessagePort) transfers ownership — zero copy cost',
        'OffscreenCanvas.transferControlToOffscreen() moves canvas rendering to a Worker; the main thread is never blocked by GPU draw calls',
        'Comlink library wraps the postMessage API with a Proxy-based interface, enabling async function calls to Worker methods without manual message routing',
        'Use cases: image/video processing, large CSV parsing, cryptography, physics simulations, machine learning inference via ONNX Web',
        'Limitations: no DOM access, no localStorage, no synchronous XMLHttpRequest; SharedArrayBuffer requires Cross-Origin Isolation headers (COOP/COEP)',
      ],
      followUps: [
        'How do you terminate a worker that is stuck in an infinite loop?',
        'What are SharedArrayBuffer and Atomics, and when would you use them over regular postMessage?',
        'How do you handle errors thrown inside a Worker from the main thread?',
      ],
      tags: ['web-workers', 'offscreen-canvas', 'transferable', 'comlink', 'performance', 'threading'],
      childExplanation: "The main thread is like a single checkout cashier who also has to manage all the stock in the store. Web Workers are like back-office staff — they do all the heavy inventory counting without interrupting the cashier from serving customers. OffscreenCanvas is like giving the back office its own dedicated display screen.",
      detailedExplanation: `<h4>Creating and Communicating with a Worker</h4>
<pre><code>// worker.ts
self.onmessage = ({ data: { pixels, width, height } }) =&gt; {
  const result = applyHeavyFilter(pixels, width, height); // pure CPU work
  self.postMessage(result, [result.buffer]); // transfer — zero copy
};

// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url));
worker.postMessage({ pixels, width, height }, [pixels.buffer]);
worker.onmessage = ({ data }) =&gt; renderToCanvas(data);</code></pre>

<h4>Transferable Objects</h4>
<p>Structured clone copies data (O(n) time). Transferring an <code>ArrayBuffer</code> moves ownership — the sending context can no longer access it. Pass the buffer as the second argument to <code>postMessage</code>:</p>
<pre><code>// Fast: transfer (zero-copy)
worker.postMessage(largeBuffer, [largeBuffer]);
// After this, largeBuffer.byteLength === 0 in main thread</code></pre>

<h4>OffscreenCanvas</h4>
<p>Transfer canvas rendering entirely to a Worker so GPU calls never block user interactions:</p>
<pre><code>const canvas = document.getElementById('chart');
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Workers cannot access localStorage or sessionStorage. Use postMessage to pass any initial data they need, or use IndexedDB (which is available in Workers) for persistence. Attempting to access window inside a Worker throws a ReferenceError.</p></div>
<blockquote>Senior Insight: For React apps, the most impactful Workers use-case is offloading large data transformations that happen after a fetch (sorting 50K rows, building a search index, decoding binary protocol buffers). Move the transform to a Worker and return plain JS objects — the component re-renders with the result while remaining fully interactive during computation.</blockquote>`,
      diagramSvg: svgs.workers,
      quiz: {
        format: 'mcq',
        question: 'What happens to an ArrayBuffer in the main thread after it is transferred (not cloned) to a Worker?',
        options: [
          'A copy is made automatically and both contexts have access',
          'The buffer is read-only in the main thread until the Worker posts it back',
          'The main thread ArrayBuffer\'s byteLength becomes 0 — ownership is transferred',
          'The ArrayBuffer is garbage collected in the main thread',
        ],
        answer: 2,
        explanation: 'Transferring an ArrayBuffer moves ownership to the Worker. The original buffer in the main thread becomes neutered (byteLength === 0) and cannot be accessed. This is the zero-copy mechanism for fast Worker communication.',
      },
    },

    /* ─── Browser 2: FLIP Animation ─────────────────────────────── */
    {
      id: 'custom-browser-flip-animation-technique-prevent-layout-thrashing-view-transitions',
      topic: 'Browser & Web APIs', subtopic: 'FLIP Animation Technique',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'What is the FLIP animation technique, how does it prevent layout thrashing during complex UI transitions, and how does the View Transitions API implement it natively?',
      expectedPoints: [
        'FLIP = First, Last, Invert, Play — measures two positions then animates a cheap CSS transform instead of causing continuous reflows',
        'First: call getBoundingClientRect() on the element in its initial state to record start position',
        'Last: apply the final state (add/remove class, reorder DOM), then call getBoundingClientRect() again — only two read phases, no interleaving',
        'Invert: apply a CSS transform (translateX, translateY, scale) that makes the element visually appear to still be in its First position',
        'Play: remove the inverted transform and add a CSS transition — the browser interpolates transform to identity (0, 0, scale 1) on the GPU compositor thread',
        'View Transitions API (document.startViewTransition()) captures First/Last snapshots automatically and handles the FLIP with ::view-transition-* pseudo-elements',
      ],
      followUps: [
        'Why do CSS transforms (translate, scale) animate on the compositor thread while top/left properties do not?',
        'How do you use the View Transitions API for multi-page (MPA) transitions in Chrome 126+?',
        'What is the WAAPI (Web Animations API) alternative to CSS transitions in a FLIP sequence?',
      ],
      tags: ['flip-animation', 'view-transitions', 'layout-thrashing', 'css-transforms', 'animation-performance'],
      childExplanation: "Normal animations are like telling someone to walk from their chair to the door while you watch their every step — the browser has to continuously recalculate where everything is. FLIP is like taking a photo of someone at their chair, then instantly teleporting them to the door, and playing a short 'walk' video clip over the teleport. The browser only measures twice instead of continuously.",
      detailedExplanation: `<h4>Why Avoid Layout During Animation</h4>
<p>Animating <code>top</code>, <code>left</code>, <code>width</code>, or <code>height</code> triggers layout recalculations every frame — expensive and janky. FLIP moves these measurements to two discrete read phases, then uses GPU-composited <code>transform</code> for the actual animation:</p>
<pre><code>function flipAnimate(element, applyFinalState) {
  // 1. First — read start position
  const first = element.getBoundingClientRect();

  // 2. Last — apply change and read end position
  applyFinalState();
  const last = element.getBoundingClientRect();

  // 3. Invert — transform element back to First position
  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;
  element.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;

  // 4. Play — transition to identity
  requestAnimationFrame(() =&gt; {
    element.style.transition = 'transform 300ms ease';
    element.style.transform = '';
  });
}</code></pre>

<h4>View Transitions API (Native FLIP)</h4>
<p>Chrome 111+ provides a high-level API that automates FLIP for same-document transitions:</p>
<pre><code>document.startViewTransition(() =&gt; {
  // Any DOM mutation here — React setState, list reorder, etc.
  moveItemToNewPosition(item);
});
// The browser automatically captures before/after snapshots
// and cross-fades or animates with ::view-transition-* pseudo-elements</code></pre>

<h4>Customising with CSS</h4>
<pre><code>::view-transition-old(root) { animation: slide-out 300ms ease; }
::view-transition-new(root) { animation: slide-in 300ms ease; }</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Calling getBoundingClientRect() after a DOM mutation but before the browser paints forces a synchronous layout (layout thrashing). In FLIP, always batch all reads before all writes — never interleave getBoundingClientRect() calls with style mutations inside a loop.</p></div>
<blockquote>Senior Insight: The View Transitions API is now the recommended approach for simple transitions — it handles snapshot capture, compositing, and fallback gracefully. Use manual FLIP only for complex multi-element choreography (drag-and-drop reordering, list shuffles) where fine-grained control over each element's trajectory is needed.</blockquote>`,
      diagramSvg: svgs.flip,
      quiz: {
        format: 'mcq',
        question: 'In the FLIP technique, why is the "Invert" step necessary after measuring the "Last" position?',
        options: [
          'It hides the element briefly to prevent a flash of unstyled content',
          'It applies a CSS transform that makes the element visually appear to be in its original First position so the animation can play forward',
          'It resets the element to its First position in the DOM',
          'It triggers the browser to cache the element on the GPU',
        ],
        answer: 1,
        explanation: 'After applying the final DOM state (Last), the element is already at its destination. The Invert step applies a CSS transform that visually offsets it back to where it started (First). The Play step then removes this transform with a transition, creating a smooth animation from First → Last entirely using GPU-composited transforms.',
      },
    },

    /* ─── Browser 3: bfcache ─────────────────────────────────────── */
    {
      id: 'custom-browser-back-forward-cache-bfcache-eligibility-debugging-patterns',
      topic: 'Browser & Web APIs', subtopic: 'Back/Forward Cache (bfcache)',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'What is the back/forward cache (bfcache), which browser APIs and patterns disqualify a page from bfcache, and how do you test and fix eligibility issues?',
      expectedPoints: [
        'bfcache stores a complete frozen snapshot of a page (JS heap + DOM) when navigating away; restoring is instant — no network round-trip, no re-render',
        'The pageshow event fires when a page is restored from bfcache; event.persisted === true distinguishes bfcache restore from a normal load',
        'Blockers: unload event handler (biggest killer), open IndexedDB transactions, pending fetch requests, WebSocket connections, opener references (window.opener)',
        'Replace unload with pagehide (fires before bfcache store) or visibilitychange for analytics and cleanup logic',
        'Cache-Control: no-store response header disqualifies the page from bfcache',
        'Test in Chrome DevTools → Application → Back/Forward Cache tab: shows exact reason a page was not cached with actionable fix suggestions',
      ],
      followUps: [
        'How do you update stale data when a page is restored from bfcache without doing a full reload?',
        'Why does adding a beforeunload listener conditionally (only when there are unsaved changes) still block bfcache in some browsers?',
        'What is the performance impact of bfcache eligibility on Core Web Vitals?',
      ],
      tags: ['bfcache', 'browser-performance', 'page-lifecycle', 'pageshow', 'pagehide', 'navigation'],
      childExplanation: "bfcache is like bookmarking your exact place in a book — when you go back, you open to exactly the same page instantly, instead of reading from the beginning. Some things stop this from working: if you had a sticky note on the page (open database connection), the library won't freeze it for you.",
      detailedExplanation: `<h4>What bfcache Stores</h4>
<p>When you navigate to a new page, the browser <em>freezes</em> the current page's entire state — the JavaScript heap, DOM, scroll position, form values — and keeps it in memory. The back/forward buttons restore this frozen snapshot instantly, bypassing the normal navigation + parse + render pipeline.</p>

<h4>Detecting bfcache Restore</h4>
<pre><code>window.addEventListener('pageshow', (event) =&gt; {
  if (event.persisted) {
    // Page was restored from bfcache — refresh stale data
    fetchLatestNotifications();
    syncCartWithServer();
  }
});</code></pre>

<h4>The #1 Killer: unload Event Handler</h4>
<p>Any <code>unload</code> event listener prevents bfcache because the browser cannot safely freeze a page that expects to run cleanup code when navigating away. Replace it:</p>
<pre><code>// ❌ Blocks bfcache
window.addEventListener('unload', sendAnalytics);

// ✅ Use pagehide instead — fires before freeze, compatible with bfcache
window.addEventListener('pagehide', (event) =&gt; {
  if (!event.persisted) sendAnalytics(); // only send if NOT going to bfcache
});</code></pre>

<h4>Other Common Blockers</h4>
<ul>
  <li><strong>Open IndexedDB transactions</strong> — close them before navigation</li>
  <li><strong>window.opener reference</strong> — pages opened with <code>window.open()</code> hold a reference that blocks the opener's bfcache</li>
  <li><strong>Cache-Control: no-store</strong> — prevents storing the page; consider using <code>no-cache</code> instead for pages that can be revalidated</li>
  <li><strong>Active WebSocket connection</strong> — reconnect after pageshow instead of keeping connections open indefinitely</li>
</ul>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Adding a beforeunload listener only when there are unsaved changes still blocks bfcache in Firefox — any registration of the event, even if the handler is removed before navigation, can disqualify the page. Test thoroughly in Chrome DevTools and Firefox's about:compat.</p></div>
<blockquote>Senior Insight: bfcache is one of the highest-impact, lowest-effort performance wins available. Fixing bfcache eligibility on a news or e-commerce site can reduce perceived navigation time from 1–2s to instant for 30–50% of back/forward navigations. Audit with Lighthouse's "Avoid large layout shifts" report — bfcache failures show up as repeated navigation overhead.</blockquote>`,
      diagramSvg: svgs.bfcache,
      quiz: {
        format: 'mcq',
        question: 'Which event should replace window.addEventListener("unload") to keep a page bfcache-eligible?',
        options: ['"beforeunload"', '"pagehide"', '"visibilitychange"', '"freeze"'],
        answer: 1,
        explanation: 'pagehide fires just before a page is hidden (including when stored in bfcache). Check event.persisted inside: if false, the page is being discarded (send analytics); if true, it\'s going into bfcache (skip cleanup). The unload event itself blocks bfcache because its presence signals the page cannot be safely frozen.',
      },
    },

    /* ─── Browser 4: WebAssembly ─────────────────────────────────── */
    {
      id: 'custom-browser-webassembly-wasm-when-to-use-integration-pattern-react',
      topic: 'Browser & Web APIs', subtopic: 'WebAssembly (WASM) Integration',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'When should you choose WebAssembly over JavaScript, and what is the typical workflow for integrating a Rust or C++ WASM module into a React app?',
      expectedPoints: [
        'Choose WASM for: CPU-bound workloads (image/audio processing, physics, codecs, crypto, ML inference) where JS performance is insufficient, and for porting existing C/C++/Rust libraries',
        'Do NOT use WASM for DOM manipulation, string-heavy web APIs, or simple math — V8\'s JIT handles these faster than WASM\'s call overhead',
        'Rust workflow: write Rust → wasm-pack build → generates .wasm + JS bindings (.js + .d.ts) → import in React like any npm package',
        'WebAssembly.instantiateStreaming(fetch(url), imports) compiles and instantiates in a single streaming pass — the most efficient loading strategy',
        'WASM memory is a flat ArrayBuffer; JS and WASM share it via typed array views — no automatic garbage collection for WASM allocations',
        'WASM threads require SharedArrayBuffer (needs COOP/COEP headers) and Atomics for synchronisation',
      ],
      followUps: [
        'How does the WASM memory model differ from JavaScript\'s garbage-collected heap?',
        'What is the startup cost of a WASM module and how do you amortise it in a React app?',
        'How do you debug a WASM module — what tools are available in Chrome DevTools?',
      ],
      tags: ['webassembly', 'wasm', 'rust', 'performance', 'wasm-pack', 'react'],
      childExplanation: "WebAssembly is like hiring a specialist contractor. Your regular team (JavaScript) handles most work efficiently, but for really heavy construction (video encoding, AI inference, physics simulation), you bring in a specialist who works much faster on that specific job. WASM is that specialist — it only makes sense to hire them when the job is genuinely heavy enough.",
      detailedExplanation: `<h4>When WASM Makes Sense</h4>
<p>V8's JIT compiler is excellent for general-purpose JavaScript. WASM wins specifically for:</p>
<ul>
  <li>Sustained CPU-bound work (video transcoding, physics engines, ML inference)</li>
  <li>Porting existing battle-tested C/C++/Rust libraries (SQLite, OpenSSL, TensorFlow Lite)</li>
  <li>Predictable performance (no JIT warmup, no GC pauses in the WASM heap)</li>
</ul>

<h4>Rust → WASM → React Workflow</h4>
<pre><code># 1. Write Rust with wasm-bindgen
use wasm_bindgen::prelude::*;
#[wasm_bindgen] pub fn compress(data: &amp;[u8]) -&gt; Vec&lt;u8&gt; { /* ... */ }

# 2. Build
$ wasm-pack build --target web

# 3. Import in React (generated pkg/)
import init, { compress } from '../pkg/my_lib';

function useCompressor() {
  const [ready, setReady] = useState(false);
  useEffect(() =&gt; {
    init().then(() =&gt; setReady(true)); // compile + instantiate once
  }, []);
  return ready ? compress : null;
}</code></pre>

<h4>Efficient Loading</h4>
<p>Calling <code>init()</code> uses <code>WebAssembly.instantiateStreaming()</code> internally — the browser compiles the WASM binary while it downloads rather than waiting for a full download. Cache the initialised module across renders (module-level variable, not component state) to avoid re-instantiation.</p>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Every call that crosses the JS/WASM boundary has overhead (type coercion, memory marshalling). If you call a tiny WASM function thousands of times per frame in a tight loop, the boundary crossing cost may exceed the computation savings. Batch calls or move the entire loop into WASM.</p></div>
<blockquote>Senior Insight: The highest-ROI WASM use in frontend is replacing slow JS polyfills. If you're polyfilling native browser features (e.g. AVIF decoding before browser support, or a missing SIMD operation), a WASM implementation with an automatic feature-detect fallback gives native-like performance with a clean API surface.</blockquote>`,
      diagramSvg: svgs.wasm,
      quiz: {
        format: 'mcq',
        question: 'Which browser API efficiently compiles and instantiates a .wasm file while it is still downloading?',
        options: [
          'new WebAssembly.Module(arrayBuffer)',
          'WebAssembly.instantiate(arrayBuffer)',
          'WebAssembly.instantiateStreaming(fetch(url))',
          'WebAssembly.compile(arrayBuffer)',
        ],
        answer: 2,
        explanation: 'WebAssembly.instantiateStreaming(fetch(url)) streams and compiles the WASM binary simultaneously — the browser doesn\'t need to wait for the full download before starting compilation, making it the fastest loading strategy.',
      },
    },

    /* ─── Performance 1: INP ─────────────────────────────────────── */
    {
      id: 'custom-perf-inp-interaction-to-next-paint-replaced-fid-march-2024',
      topic: 'Web Performance', subtopic: 'INP — Interaction to Next Paint',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'INP replaced FID as a Core Web Vital in March 2024. What does it measure, why is it a better metric than FID, and what are the primary techniques for reducing it?',
      expectedPoints: [
        'INP = the 75th-percentile duration of all interactions (clicks, key presses, taps) during a page visit: input delay + processing time + presentation delay',
        'FID measured only the first interaction\'s input delay; INP measures every interaction across the whole visit — a more representative responsiveness score',
        'Good threshold: < 200ms · Needs improvement: 200–500ms · Poor: > 500ms',
        'Input delay is caused by long tasks on the main thread when the interaction arrives — break them up with scheduler.yield() or move to Web Workers',
        'Processing time optimisation: avoid synchronous DOM reads inside event handlers (forced reflow), debounce continuous events, defer non-visual work with setTimeout/requestIdleCallback',
        'Presentation delay: avoid large rendering work triggered by the handler; use CSS contain, virtual lists, and avoid synchronous style recalculations in the critical path',
      ],
      followUps: [
        'How do you measure INP in the field using the web-vitals.js library, and how do you attribute which interaction caused a poor INP?',
        'What is "interaction attribution" and how does the PerformanceObserver EventTiming API help diagnose the cause of high INP?',
        'Why does React\'s concurrent mode with startTransition help INP specifically?',
      ],
      tags: ['inp', 'core-web-vitals', 'interaction', 'performance', 'main-thread', 'event-timing'],
      childExplanation: "FID was like a restaurant measuring only how fast the first waiter appeared. INP measures every single time you wave for service during your whole meal. A restaurant that's fast at first but gets slower throughout dinner scores badly — just like a page that's fast to load but sluggish once you're using it.",
      detailedExplanation: `<h4>INP Components</h4>
<p>Every user interaction is measured from the moment the event fires to the next frame that reflects the response:</p>
<ul>
  <li><strong>Input delay</strong> — time from event firing to when a handler begins; caused by long tasks blocking the main thread</li>
  <li><strong>Processing time</strong> — time to run all event handlers (onClick, onKeyDown) synchronously</li>
  <li><strong>Presentation delay</strong> — time from handler completion to when the updated frame is painted</li>
</ul>
<p>The browser reports the 75th-percentile interaction — so one sluggish interaction in a complex flow can push your INP score into the red.</p>

<h4>Measuring INP with web-vitals.js</h4>
<pre><code>import { onINP } from 'web-vitals/attribution';
onINP(({ value, attribution }) =&gt; {
  console.log('INP:', value, 'ms');
  console.log('Interaction target:', attribution.interactionTarget);
  console.log('Input delay:', attribution.inputDelay);
  console.log('Processing time:', attribution.processingDuration);
});</code></pre>

<h4>Reducing Processing Time</h4>
<pre><code>// ❌ Forces synchronous layout — slow
button.addEventListener('click', () =&gt; {
  const height = element.offsetHeight; // forces layout
  doExpensiveWork();
});

// ✅ Read first, then write asynchronously
button.addEventListener('click', () =&gt; {
  const height = element.offsetHeight; // read in microtask
  setTimeout(() =&gt; doExpensiveWork(), 0); // defer non-visual work
});</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Animations driven by JavaScript (requestAnimationFrame loops updating element styles) can inflate INP if they coincide with user interactions. Move animations to CSS transitions or the Web Animations API — these run on the compositor thread and don't compete with JS event handlers for the main thread.</p></div>
<blockquote>Senior Insight: The most common source of poor INP in React SPAs is large synchronous state updates triggered by user interactions. A single setState that re-renders a 500-component tree can easily exceed 200ms. The fix: wrap non-visual updates in startTransition and use React.memo/useMemo to minimise re-render scope.</blockquote>`,
      diagramSvg: svgs.inp,
      quiz: {
        format: 'mcq',
        question: 'What is the "Good" INP threshold according to Google\'s Core Web Vitals specification?',
        options: ['< 100ms', '< 200ms', '< 300ms', '< 500ms'],
        answer: 1,
        explanation: 'INP Good: < 200ms · Needs improvement: 200–500ms · Poor: > 500ms. The 75th percentile of all interactions during a page visit is reported as the INP score.',
      },
    },

    /* ─── Performance 2: Priority Hints ─────────────────────────── */
    {
      id: 'custom-perf-priority-hints-fetchpriority-attribute-improve-lcp-loading',
      topic: 'Web Performance', subtopic: 'Priority Hints API (fetchpriority)',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How do Priority Hints (the fetchpriority attribute and Fetch API priority option) let you override the browser\'s default resource prioritization to improve LCP?',
      expectedPoints: [
        'fetchpriority="high" boosts a resource in the browser\'s preload queue — use on the LCP <img> to ensure it is downloaded before lower-priority resources',
        'fetchpriority="low" deprioritises resources that are not immediately needed — use on below-fold images, non-critical scripts, and analytics payloads',
        'The Fetch API priority option: fetch(url, { priority: "high" | "low" | "auto" }) applies the same semantics to programmatic requests',
        'Priority Hints change relative ordering within the same resource type, not the overall loading timeline — they don\'t make a resource download earlier than discovery time',
        'Combine with rel="preload" for early discovery + high priority: <link rel="preload" as="image" href="hero.webp" fetchpriority="high">',
        'Do NOT mark multiple resources as high priority — the hint loses meaning if everything is "high"; use it only for the single most critical resource per page',
      ],
      followUps: [
        'How do Priority Hints interact with the HTTP/2 server push mechanism?',
        'What is the difference between fetchpriority="high" on an img tag vs. rel="preload" with fetchpriority="high"?',
        'How do you measure whether a fetchpriority change improved LCP in a real-user monitoring setup?',
      ],
      tags: ['priority-hints', 'fetchpriority', 'lcp', 'resource-loading', 'preload', 'performance'],
      childExplanation: "Imagine a cargo ship loading containers. Normally the crew loads in a fixed order. Priority Hints are like a captain flagging certain containers as 'must load first' or 'load last if there's space'. The most important cargo (your hero image) gets loaded onto the ship before anything else.",
      detailedExplanation: `<h4>Basic Usage</h4>
<pre><code>&lt;!-- Hero image — boost to load before other images --&gt;
&lt;img src="hero.webp" fetchpriority="high" alt="Hero" /&gt;

&lt;!-- Below-fold images — deprioritise --&gt;
&lt;img src="card-1.webp" fetchpriority="low" loading="lazy" /&gt;

&lt;!-- Programmatic fetch for critical data --&gt;
fetch('/api/above-fold-data', { priority: 'high' });</code></pre>

<h4>Combined with Preload</h4>
<p>Without <code>fetchpriority</code>, a <code>&lt;link rel="preload"&gt;</code> for an image gets medium priority by default — lower than the parser-discovered <code>&lt;img&gt;</code> tag. Adding <code>fetchpriority="high"</code> ensures it is treated as critical from the moment the <code>&lt;link&gt;</code> is parsed:</p>
<pre><code>&lt;link rel="preload" as="image" href="hero.webp" fetchpriority="high" /&gt;</code></pre>

<h4>Browser Default Priorities (Chromium)</h4>
<ul>
  <li><strong>Highest</strong>: render-blocking CSS, synchronous scripts</li>
  <li><strong>High</strong>: parser-discovered images in viewport, fetch()</li>
  <li><strong>Medium</strong>: async scripts, preloaded fonts</li>
  <li><strong>Low</strong>: images outside viewport, prefetch</li>
</ul>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Adding fetchpriority="high" to every above-the-fold image defeats the purpose — the browser uses relative ordering, so if all images are "high" they all have the same effective priority. Identify the single LCP element (usually the hero image) and apply fetchpriority="high" to that one image only.</p></div>
<blockquote>Senior Insight: Priority Hints are especially valuable for SPAs that dynamically inject &lt;img&gt; tags through JavaScript — the browser doesn't see these during HTML parsing and assigns them default priority. Explicit fetchpriority="high" on injected LCP images can recover 200–400ms of LCP time compared to default priority.</blockquote>`,
      diagramSvg: svgs.prio,
      quiz: {
        format: 'mcq',
        question: 'Which resource should receive fetchpriority="high" for best LCP improvement?',
        options: [
          'All images above the fold',
          'The single LCP image (hero/banner) only',
          'All link rel="preload" resources',
          'JavaScript bundle files',
        ],
        answer: 1,
        explanation: 'Priority Hints work by relative ordering — boosting everything is the same as boosting nothing. Apply fetchpriority="high" only to the LCP candidate (the hero image or banner) to ensure it wins the queue ahead of other images and non-critical resources.',
      },
    },

    /* ─── Performance 3: Speculation Rules ──────────────────────── */
    {
      id: 'custom-perf-speculation-rules-api-prefetch-vs-prerender-instant-navigation',
      topic: 'Web Performance', subtopic: 'Speculation Rules API',
      difficulty: 'senior', type: 'tradeoff', sourceFile: 'custom',
      question: 'What is the Speculation Rules API, how does prerender differ from <link rel="prefetch">, and what risks must you mitigate before enabling page prerendering?',
      expectedPoints: [
        '<link rel="prefetch"> fetches the document HTML only — no JS execution, no sub-resource loading; safe but the page still needs full parsing/rendering on navigation',
        'Speculation Rules prerender mode fetches, parses, executes JavaScript, and renders a full page in a hidden background browsing context — navigation is near-instant',
        'Speculation Rules are declared as JSON in <script type="speculationrules"> — can target URLs by pattern, list, or href selector, with eagerness levels (immediate, eager, moderate, conservative)',
        'Risk 1: Side effects — analytics events (page_view), ad impression pixels, and auth-modifying requests fire in the prerendered context before the user actually navigates',
        'Risk 2: Memory overhead — a prerendered page consumes ~100MB of RAM; browsers limit concurrent prerenders; avoid prerendering all links on a page',
        'Fix: use document.prerendering to gate analytics and side-effecting code; only fire analytics in pageshow when event.persisted is false and document.prerendering is false',
      ],
      followUps: [
        'How do you prevent a prerendered page from making authenticated API calls before the user navigates to it?',
        'What is the speculation rules "eagerness" setting and how does "conservative" differ from "immediate"?',
        'How does Chrome\'s NoStatePrefetch differ from full prerender?',
      ],
      tags: ['speculation-rules', 'prerender', 'prefetch', 'navigation-performance', 'instant-navigation'],
      childExplanation: "Old prefetch is like printing a document before you need it — the paper is ready but you still have to open and read it. Prerender is like having an assistant who not only prints the document but highlights the key sections and opens it to the right page — when you pick it up, it's instantly ready to use.",
      detailedExplanation: `<h4>Declaring Speculation Rules</h4>
<pre><code>&lt;script type="speculationrules"&gt;
{
  "prerender": [
    { "where": { "selector_matches": "a.prerender-me" }, "eagerness": "moderate" }
  ],
  "prefetch": [
    { "urls": ["/products", "/about"], "eagerness": "conservative" }
  ]
}
&lt;/script&gt;</code></pre>

<h4>Eagerness Levels</h4>
<ul>
  <li><strong>immediate</strong> — triggers as soon as the rule is parsed</li>
  <li><strong>eager</strong> — triggers on hover/mousedown</li>
  <li><strong>moderate</strong> — triggers after 200ms hover</li>
  <li><strong>conservative</strong> — triggers only on pointerdown/touchstart</li>
</ul>

<h4>Preventing Double Analytics</h4>
<pre><code>// ❌ Fires in prerendered context before navigation
window.sendBeacon('/analytics', { event: 'page_view' });

// ✅ Gate on prerendering state
window.addEventListener('pageshow', (e) =&gt; {
  if (!document.prerendering &amp;&amp; !e.persisted) {
    sendBeacon('/analytics', { event: 'page_view' });
  }
});
// Also listen for prerender → real page activation:
document.addEventListener('prerenderingchange', () =&gt; {
  if (!document.prerendering) sendBeacon('/analytics', { event: 'page_view' });
});</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Pages that require credentials (authenticated state) need the Supports-Loading-Mode: credentialed-prerender response header to allow cross-origin prerender with cookies. Without it, prerender happens in an anonymous (cookie-free) context, and any API calls inside the prerendered page receive unauthenticated responses.</p></div>
<blockquote>Senior Insight: Speculation Rules prerender is most effective for high-confidence navigation paths — "add to cart" → "checkout", tutorial step 1 → step 2, article list → most-clicked article. A/B test on pages where analytics show >70% of users visit a predictable next page. The memory cost is justified only for these high-probability flows.</blockquote>`,
      diagramSvg: svgs.spec,
      quiz: {
        format: 'mcq',
        question: 'What is the key difference between <link rel="prefetch"> and Speculation Rules prerender mode?',
        options: [
          'prefetch loads resources; prerender only loads the HTML document',
          'prerender executes JavaScript and fully renders the page in a background context; prefetch only downloads the document HTML',
          'prefetch is faster than prerender for most pages',
          'prerender requires a Service Worker; prefetch does not',
        ],
        answer: 1,
        explanation: 'Speculation Rules prerender creates a complete hidden browsing context — JS executes, sub-resources load, the page renders. Navigation is near-instant because the page is already "alive". prefetch only downloads the HTML document; the browser still parses, executes JS, and renders on navigation.',
      },
    },

    /* ─── Testing 1: MSW ─────────────────────────────────────────── */
    {
      id: 'custom-testing-msw-mock-service-worker-preferred-approach-api-mocking',
      topic: 'Testing', subtopic: 'Mock Service Worker (MSW) for API Testing',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How does Mock Service Worker (MSW) differ from jest.mock or axios-mock-adapter, and why is it considered the preferred approach for testing fetch-based React components?',
      expectedPoints: [
        'MSW intercepts at the network level (Service Worker in browsers, Node http module in Jest) — no module mocking required; the actual fetch() or axios code executes as written',
        'jest.mock replaces the module itself, meaning tests verify the mocked module\'s API not the real HTTP interaction — implementation changes that don\'t change the mock can pass tests while real code breaks',
        'MSW handlers are reusable across unit tests (Jest + jsdom), integration tests (Playwright), and local development — a single source of truth for mock APIs',
        'Handler format: http.get("/api/user", ({ request }) => HttpResponse.json({id:1})) — strongly typed with TypeScript, matches real fetch behavior',
        'MSW supports error simulation: HttpResponse.error() for network errors, non-2xx status codes, streaming responses, and GraphQL operations',
        'server.use() allows per-test overrides without affecting other tests; server.resetHandlers() in afterEach restores defaults',
      ],
      followUps: [
        'How do you share MSW handlers between Jest tests and a local development server running alongside the app?',
        'How do you test loading/error states with MSW without introducing arbitrary delays?',
        'Can MSW intercept WebSocket connections, and if so, how?',
      ],
      tags: ['msw', 'mock-service-worker', 'testing', 'api-mocking', 'jest', 'react-testing'],
      childExplanation: "jest.mock is like replacing a restaurant's kitchen with a cardboard replica — the test sees a fake kitchen and the real cooking code never runs. MSW is like intercepting the food delivery truck — the kitchen cooks normally, uses real recipes, but the delivery truck brings back mock ingredients. Your real cooking code runs, just with controlled inputs.",
      detailedExplanation: `<h4>Setup</h4>
<pre><code>// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/user/:id', ({ params }) =&gt;
    HttpResponse.json({ id: params.id, name: 'Alice' })
  ),
  http.post('/api/orders', async ({ request }) =&gt; {
    const body = await request.json();
    return HttpResponse.json({ orderId: '123', ...body }, { status: 201 });
  }),
];

// src/mocks/server.ts (Node/Jest)
import { setupServer } from 'msw/node';
export const server = setupServer(...handlers);</code></pre>

<h4>Jest Integration</h4>
<pre><code>// jest.setup.ts
beforeAll(() =&gt; server.listen());
afterEach(() =&gt; server.resetHandlers()); // clean up per-test overrides
afterAll(() =&gt; server.close());

// Test
test('shows user name after fetch', async () =&gt; {
  render(&lt;UserProfile id="1" /&gt;);
  await screen.findByText('Alice'); // real fetch, real component logic
});

// Per-test error simulation
test('shows error message on 500', async () =&gt; {
  server.use(http.get('/api/user/:id', () =&gt; new HttpResponse(null, { status: 500 })));
  render(&lt;UserProfile id="1" /&gt;);
  await screen.findByText(/something went wrong/i);
});</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Forgetting server.resetHandlers() in afterEach causes test contamination — a per-test override from one test leaks into subsequent tests, creating order-dependent failures. Always call resetHandlers() in afterEach, not afterAll.</p></div>
<blockquote>Senior Insight: The real value of MSW is the confidence gap it closes. With jest.mock, a refactor from fetch to axios (or vice versa) passes all tests even if you forgot to update the mock — because the mock never exercised the real HTTP layer. With MSW, the actual network client code runs and the test fails if the code breaks, regardless of which HTTP library is used.</blockquote>`,
      diagramSvg: svgs.msw,
      quiz: {
        format: 'mcq',
        question: 'What does MSW use in a Node.js (Jest) environment to intercept HTTP requests?',
        options: [
          'A mock Service Worker running in a worker thread',
          'Monkey-patching the global fetch function',
          'An interception layer on Node\'s built-in http/https modules',
          'A Proxy wrapping the axios instance',
        ],
        answer: 2,
        explanation: 'In Node.js, MSW intercepts at the http and https module level (not via Service Workers, which are browser-only). This means it works with any HTTP library — fetch, axios, got, node-fetch — without any library-specific mocking.',
      },
    },

    /* ─── Testing 2: axe-core A11y ───────────────────────────────── */
    {
      id: 'custom-testing-axe-core-automated-accessibility-ci-wcag-limitations',
      topic: 'Testing', subtopic: 'Automated A11y Testing with axe-core',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How do you integrate automated accessibility testing with axe-core into a CI pipeline, and what WCAG violations can (and cannot) be caught automatically?',
      expectedPoints: [
        'jest-axe: const results = await axe(container); expect(results).toHaveNoViolations() — runs axe rules against the rendered DOM in Jest',
        '@axe-core/playwright: await checkA11y(page) in Playwright tests — works with real browser rendering including CSS visibility and focus indicators',
        'Automated tools catch approximately 30–40% of WCAG 2.1 AA issues: missing alt text, insufficient color contrast, absent form labels, invalid ARIA roles, empty buttons/links',
        'NOT automatically detectable: meaningful alt text content, logical reading order, focus flow correctness, keyboard trap detection, cognitive load, error announcement timing',
        'Configure axe with custom rules, disabling false-positive rules per component, or restricting to specific WCAG levels (wcag2aa)',
        'Supplement with: keyboard-only navigation testing, screen reader testing (NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari), and user testing with assistive technology users',
      ],
      followUps: [
        'How do you handle axe violations in third-party component library code that you cannot modify?',
        'What is the difference between critical, serious, moderate, and minor impact in axe violation reports?',
        'How do you test dynamic ARIA live regions that announce content changes to screen readers?',
      ],
      tags: ['accessibility', 'axe-core', 'wcag', 'jest-axe', 'a11y', 'ci', 'screen-readers'],
      childExplanation: "axe-core is like a building inspector who checks for ramps, wide doorways, and fire exit signs — things that can be measured with a ruler. But they can't tell you if the emergency exit instructions make sense when read out loud, or if the building layout is confusing to navigate. You still need to walk through the building yourself.",
      detailedExplanation: `<h4>Jest Integration with jest-axe</h4>
<pre><code>import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('LoginForm has no accessibility violations', async () =&gt; {
  const { container } = render(&lt;LoginForm /&gt;);
  const results = await axe(container, {
    rules: { 'color-contrast': { enabled: true } },
  });
  expect(results).toHaveNoViolations();
});</code></pre>

<h4>Playwright Integration</h4>
<pre><code>import { checkA11y, injectAxe } from 'axe-playwright';

test('checkout page a11y', async ({ page }) =&gt; {
  await page.goto('/checkout');
  await injectAxe(page);
  await checkA11y(page, undefined, {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
  });
});</code></pre>

<h4>What axe Catches vs. Misses</h4>
<ul>
  <li><strong>✅ Catches</strong>: missing/empty alt, color contrast &lt;4.5:1, form inputs without labels, invalid ARIA attributes, buttons/links without accessible names, heading level skips</li>
  <li><strong>❌ Misses</strong>: alt text that says "image" instead of describing the content, illogical focus order, keyboard traps in complex widgets, live region timing, content that is visually hidden but ARIA-visible</li>
</ul>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Running axe only in unit tests (jsdom) misses CSS-dependent violations. jsdom doesn't compute color contrast from CSS variables or resolve computed styles accurately. Always complement with Playwright/Cypress axe tests in a real browser for accurate color contrast and focus indicator checks.</p></div>
<blockquote>Senior Insight: The most impactful accessibility issues are almost always caught manually, not by automated tools. Consider scheduling monthly keyboard-only reviews of critical user flows (checkout, sign-up, settings) where a developer navigates the entire flow using Tab, Shift-Tab, Enter, and arrow keys only. This catches more real issues per hour than expanding automated test coverage.</blockquote>`,
      diagramSvg: svgs.axe,
      quiz: {
        format: 'mcq',
        question: 'Approximately what percentage of WCAG 2.1 AA violations can automated tools like axe-core detect?',
        options: ['~10%', '~35%', '~70%', '~90%'],
        answer: 1,
        explanation: 'Automated accessibility tools detect roughly 30–40% of WCAG issues — those that can be checked programmatically (contrast ratios, ARIA syntax, label associations). The majority (~60–70%) require human judgment: meaningful content, logical structure, cognitive load, and assistive technology behavior.',
      },
    },

    /* ─── Testing 3: Lighthouse CI ───────────────────────────────── */
    {
      id: 'custom-testing-lighthouse-ci-performance-regression-pr-workflow-budgets',
      topic: 'Testing', subtopic: 'Lighthouse CI for Performance Regression',
      difficulty: 'senior', type: 'system_design', sourceFile: 'custom',
      question: 'How do you configure Lighthouse CI to prevent performance regressions in a pull request workflow, and which metric budgets most reliably detect real-user degradation?',
      expectedPoints: [
        'lhci autorun in CI: collects N runs, takes the median, asserts against configured budgets, uploads to LHCI server or storage provider',
        'Key budget assertions in lighthouserc.js: LCP < 2500ms, INP < 200ms (use TBT < 200ms as lab proxy), CLS < 0.1, TBT < 200ms, FCP < 1800ms',
        'Delta comparison: assert "maxNumericValueRegression" or compare against a stored baseline to block PRs that degrade metrics by more than a threshold (e.g. LCP +200ms)',
        'Run on identical infrastructure (same CPU tier, same network throttling) every time — cross-environment comparison is meaningless due to CPU variability',
        'TBT (Total Blocking Time) is the lab-measurable proxy for INP — it sums blocking time of all long tasks and correlates with real-world interaction latency',
        'Separate budgets for mobile (4G throttling, 4x CPU slowdown) and desktop; most real users are on mobile — prioritise mobile budgets',
      ],
      followUps: [
        'Why does Lighthouse CI run multiple iterations and take the median rather than using a single run?',
        'How do you handle "flaky" Lighthouse CI results caused by server-side variability (cold starts, CDN jitter)?',
        'What is the difference between Lighthouse performance score and individual metric budgets?',
      ],
      tags: ['lighthouse-ci', 'performance-testing', 'ci-cd', 'web-vitals', 'performance-budget'],
      childExplanation: "Lighthouse CI is like having a speed camera on every road in your codebase. Every time someone proposes a change (PR), the camera measures how fast the page loads. If it's slower than the speed limit (budget), the change is flagged before it reaches production.",
      detailedExplanation: `<h4>lighthouserc.js Configuration</h4>
<pre><code>module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ['http://localhost:3000/', 'http://localhost:3000/checkout'],
      settings: {
        throttlingMethod: 'simulate',
        throttling: { cpuSlowdownMultiplier: 4 }, // mobile CPU
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
      },
    },
    upload: { target: 'lhci', serverBaseUrl: 'https://lhci.example.com' },
  },
};
</code></pre>

<h4>GitHub Actions Integration</h4>
<pre><code>- name: Run Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}</code></pre>

<h4>Why TBT Proxies INP in Lab</h4>
<p>INP requires real user interactions and cannot be measured in a synthetic lab test. TBT sums all blocking time (task duration − 50ms) for tasks >50ms during page load, which correlates well with slow interactions. A TBT &lt; 200ms strongly predicts INP &lt; 200ms in most cases.</p>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Running Lighthouse on shared CI runners with variable CPU causes high variance — the same PR can pass on Monday and fail on Thursday due to noisy neighbours. Use dedicated runners for Lighthouse jobs, run 5+ iterations, and set assert thresholds at 1.2× the expected value to absorb natural variance.</p></div>
<blockquote>Senior Insight: The Lighthouse performance score (0–100) is a weighted composite — it's useful for executive dashboards but too opaque for engineering decisions. Always assert on individual metric values (LCP ms, TBT ms, CLS) in CI rather than the composite score. A single metric regression that drops the score from 94→89 is actionable; "score dropped" is not.</blockquote>`,
      diagramSvg: svgs.lhci,
      quiz: {
        format: 'mcq',
        question: 'Why is Total Blocking Time (TBT) used as a proxy for INP in Lighthouse CI lab tests?',
        options: [
          'TBT and INP are calculated with the same formula',
          'INP cannot be measured in synthetic tests since it requires real user interactions; TBT correlates with interaction latency by measuring long task blocking time',
          'TBT is more accurate than INP for mobile devices',
          'INP is not yet supported by Lighthouse',
        ],
        answer: 1,
        explanation: 'INP measures real user interaction latency — impossible to simulate in a lab without actual user input. TBT sums the blocking portions of all long tasks (>50ms each) during load, which strongly predicts slow INP: if long tasks block the main thread, interactions will be delayed when they coincide with those tasks.',
      },
    },
  ] as const;
}

/* ── Main ── */
async function main() {
  const svgs = {
    workers:  renderDiagramSpec(WORKERS_SPEC),
    flip:     renderDiagramSpec(FLIP_SPEC),
    bfcache:  renderDiagramSpec(BFCACHE_SPEC),
    wasm:     renderDiagramSpec(WASM_SPEC),
    inp:      renderDiagramSpec(INP_SPEC),
    prio:     renderDiagramSpec(PRIO_SPEC),
    spec:     renderDiagramSpec(SPEC_SPEC),
    msw:      renderDiagramSpec(MSW_SPEC),
    axe:      renderDiagramSpec(AXE_SPEC),
    lhci:     renderDiagramSpec(LHCI_SPEC),
  };

  const questions = buildQuestions(svgs);

  // Update JSON seed files
  const browserQ  = questions.filter((q) => q.topic === 'Browser & Web APIs');
  const perfQ     = questions.filter((q) => q.topic === 'Web Performance');
  const testingQ  = questions.filter((q) => q.topic === 'Testing');

  console.log(`✓ browser-and-web-apis.json → ${upsertJson('prisma/seed/questions/browser-and-web-apis.json', browserQ)} total`);
  console.log(`✓ web-performance.json      → ${upsertJson('prisma/seed/questions/web-performance.json', perfQ)} total`);
  console.log(`✓ testing.json              → ${upsertJson('prisma/seed/questions/testing.json', testingQ)} total`);

  // Upsert to DB
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const q of questions) {
      const { diagramSvg, quiz, ...rest } = q as any;
      await prisma.seedQuestion.upsert({
        where:  { id: q.id },
        update: { ...rest, diagramSvg, diagramMermaid: null, quiz: JSON.stringify(quiz), rubric: {} },
        create: { ...rest, diagramSvg, diagramMermaid: null, quiz: JSON.stringify(quiz), rubric: {} },
      });
      const vb = diagramSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      console.log(`  ✓ ${q.id.slice(0, 62)}  [${vb ? `${vb[1]}×${vb[2]}` : '?'}]`);
    }
    console.log(`\n✅ Seeded ${questions.length} questions (Browser: 4, Performance: 3, Testing: 3)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
