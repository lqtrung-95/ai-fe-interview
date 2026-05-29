/**
 * Generates and seeds 3 advanced CSS isolation questions for micro-frontends.
 * Appends to prisma/seed/questions/frontend-system-design.json and
 * then runs the DB seed to upsert rows.
 *
 * Usage: pnpm tsx scripts/seed-css-isolation-questions.ts
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { renderDiagramSpec } from './diagram-spec-renderer';
import type { DiagramSpec } from './extract-seed-types';

loadEnv({ path: '.env.local' });

/* ── Diagram specs ────────────────────────────────────────────────────────── */

const Q1_DIAGRAM: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'shell',  label: 'Shell App',    sublabel: 'host · layout · router',    color: 'teal'   },
    { id: 'shadow', label: 'Shadow DOM',   sublabel: 'native encapsulation',      color: 'purple' },
    { id: 'mod',    label: 'CSS Modules',  sublabel: 'build-time class hashing',  color: 'blue'   },
    { id: 'cssjs',  label: 'CSS-in-JS',    sublabel: 'runtime scoped injection',  color: 'orange' },
    { id: 'post',   label: 'PostCSS NS',   sublabel: 'selector prefixing',        color: 'green'  },
    { id: 'layer',  label: '@layer',       sublabel: 'cascade layer ordering',    color: 'amber'  },
  ],
  edges: [
    { from: 'shell', to: 'shadow' },
    { from: 'shell', to: 'mod'    },
    { from: 'shell', to: 'cssjs'  },
    { from: 'shell', to: 'post'   },
    { from: 'shell', to: 'layer'  },
  ],
  caption: 'native (Shadow DOM) → build-time (Modules/PostCSS) → runtime (CSS-in-JS) → cascade (@layer)',
};

const Q2_DIAGRAM: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'host',   label: 'Shell DOM',     sublabel: 'global styles apply here', color: 'teal'   },
    { id: 'ce',     label: 'Custom Element', sublabel: 'Web Component boundary',  color: 'blue'   },
    { id: 'sr',     label: 'Shadow Root',    sublabel: ':host, ::part(), ::slotted()', color: 'purple' },
    { id: 'inner',  label: 'Micro App',      sublabel: 'encapsulated styles',     color: 'green'  },
    { id: 'slot',   label: '<slot>',         sublabel: 'light DOM projection',    color: 'orange' },
  ],
  edges: [
    { from: 'host',  to: 'ce'    },
    { from: 'ce',    to: 'sr'    },
    { from: 'sr',    to: 'inner' },
    { from: 'sr',    to: 'slot', dashed: true },
  ],
  caption: 'Shadow boundary blocks global styles · ::part() is the only escape hatch for host theming',
};

const Q3_DIAGRAM: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'ds',     label: 'Design System', sublabel: 'Tailwind base styles',         color: 'teal'   },
    { id: 'prefix', label: 'Prefix Config', sublabel: "prefix: 'shell-'",             color: 'blue'   },
    { id: 'alayer', label: '@layer order',  sublabel: 'base → components → utils',    color: 'purple' },
    { id: 'shell',  label: 'Shell Bundle',  sublabel: 'shell-bg-white · no leakage',  color: 'green'  },
    { id: 'micro',  label: 'Micro Bundles', sublabel: 'mfe-bg-white · isolated',      color: 'orange' },
  ],
  edges: [
    { from: 'ds',     to: 'prefix' },
    { from: 'ds',     to: 'alayer' },
    { from: 'prefix', to: 'shell'  },
    { from: 'prefix', to: 'micro'  },
    { from: 'alayer', to: 'shell', dashed: true },
    { from: 'alayer', to: 'micro', dashed: true },
  ],
  caption: 'per-app Tailwind prefix + @layer prevents specificity wars between Shell and MFE bundles',
};

/* ── Question definitions ─────────────────────────────────────────────────── */

function buildQuestions(svgs: string[]) {
  const [svg1, svg2, svg3] = svgs;
  return [
    {
      id: 'custom-micro-frontend-css-isolation-what-strategies-can-you-use-to',
      topic: 'Frontend System Design',
      subtopic: 'CSS Isolation in Micro-Frontends',
      difficulty: 'senior',
      type: 'tradeoff',
      question: 'What strategies can you use to isolate CSS between a Shell App and Micro Apps in a micro-frontend architecture, and what are their trade-offs?',
      expectedPoints: [
        'Shadow DOM / Web Components — native browser boundary, no global styles leak in, but ::part() is the only hook for host theming',
        'CSS Modules — build-time class name hashing; zero runtime cost, but each bundle must be compiled separately',
        'CSS-in-JS (Emotion, styled-components) — runtime injection with automatic scoping; adds JS payload and SSR complexity',
        'PostCSS namespace prefixing — static selector prefixes (e.g. .mfe-header) applied at build time via a plugin',
        '@layer and CSS @scope (native cascade control) — new baseline spec; lets Shell declare layer order without JS',
        'Iframe sandboxing — full isolation at the cost of shared state, routing, and cross-origin communication',
      ],
      followUps: [
        'Which strategy works best when Micro Apps are loaded via Module Federation vs iframes?',
        'How do you share CSS custom properties (design tokens) across isolation boundaries?',
        'What happens to global resets (like normalize.css) when multiple Micro Apps load simultaneously?',
      ],
      rubric: {},
      tags: ['micro-frontends', 'css', 'architecture', 'shadow-dom', 'css-modules'],
      sourceFile: 'custom',
      childExplanation: 'Imagine your web page is a big house. The Shell App is the main hallway, and each Micro App is a separate room. CSS isolation is like having each room painted independently — what you do in one room (like painting the walls red) doesn\'t accidentally bleed into the hallway or other rooms.',
      detailedExplanation: `<h4>The Problem: CSS in Micro-Frontends</h4>
<p>When multiple independently-deployed Micro Apps share the same DOM, their CSS can collide. A <code>.btn-primary</code> class in the Shell may override the same class in a Micro App (or vice versa), causing visual inconsistencies that are hard to debug because the bug only surfaces when both apps are composed together.</p>

<h4>Strategy 1 — Shadow DOM (Web Components)</h4>
<p><strong>Shadow DOM</strong> creates a hard browser-enforced boundary. Styles inside a shadow root cannot leak out, and global styles cannot penetrate in. This is the strongest isolation available natively.</p>
<ul>
  <li><strong>Pro:</strong> Zero build tooling required; browsers enforce the boundary.</li>
  <li><strong>Pro:</strong> Each Micro App is truly self-contained as a Custom Element.</li>
  <li><strong>Con:</strong> The host (Shell) can only theme the Micro App via <code>::part()</code> named slots — requires explicit API design.</li>
  <li><strong>Con:</strong> Accessibility trees, focus management, and some framework SSR modes need extra work.</li>
</ul>

<h4>Strategy 2 — CSS Modules</h4>
<p>CSS Modules hash class names at build time (<code>.button</code> → <code>.button_xK9p</code>). This prevents clashes as long as each app is compiled separately.</p>
<ul>
  <li><strong>Pro:</strong> Zero runtime overhead; works with any framework.</li>
  <li><strong>Con:</strong> Global selectors (element or attribute selectors) still escape; <code>:global</code> must be used carefully.</li>
</ul>

<h4>Strategy 3 — CSS-in-JS</h4>
<p>Libraries like <strong>Emotion</strong> or <strong>styled-components</strong> generate unique class names at runtime. Full framework integration and easy theming via context.</p>
<ul>
  <li><strong>Pro:</strong> Dynamic theming; plays well with React/Vue.</li>
  <li><strong>Con:</strong> Runtime JS cost; SSR requires server-side extraction; two apps using Emotion may conflict on critical CSS injection order.</li>
</ul>

<h4>Strategy 4 — PostCSS Namespace Prefix</h4>
<p>A PostCSS plugin prefixes all selectors with an app-specific string: <code>.header</code> → <code>.mfe-checkout .header</code>. Simple, build-time, no runtime.</p>

<h4>Strategy 5 — CSS @layer and @scope</h4>
<p>The cascade <code>@layer</code> rule lets you declare layer priority without specificity hacks. The newer <code>@scope</code> at-rule limits where styles apply. Both are now baseline-available in modern browsers.</p>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Sharing a global CSS reset (e.g. normalize.css or Tailwind's base) across all Micro Apps is tempting for DRY, but if each app loads it independently, you get duplicate rules. If loaded once in the Shell, Micro Apps become implicitly dependent on the Shell's version — a hidden coupling.</p></div>

<blockquote>Senior Insight: There is no universally "correct" strategy. Shadow DOM is best for true isolation with a public API; CSS Modules + PostCSS prefix is the pragmatic default for Module Federation setups; CSS-in-JS fits React-heavy teams willing to pay the SSR tax.</blockquote>`,
      diagramSvg: svg1,
      quiz: {
        format: 'mcq',
        question: 'Which CSS isolation strategy creates a browser-enforced style boundary with no build tooling?',
        options: ['CSS Modules', 'Shadow DOM', 'PostCSS namespace', 'CSS-in-JS'],
        answer: 1,
        explanation: 'Shadow DOM creates a native browser boundary. Global styles cannot pierce into a shadow root, and shadow styles cannot leak out — no build step required.',
      },
    },

    {
      id: 'custom-micro-frontend-shadow-dom-how-does-shadow-dom-provide-style-encap',
      topic: 'Frontend System Design',
      subtopic: 'CSS Isolation in Micro-Frontends',
      difficulty: 'senior',
      type: 'conceptual',
      question: 'How does Shadow DOM provide style encapsulation, and when would you choose it over CSS Modules for a Micro App?',
      expectedPoints: [
        'Shadow root creates an isolated DOM sub-tree; CSS inside cannot leak to the global scope and vice versa',
        '::part() named parts expose intentional theming hooks to the host without breaking encapsulation',
        '::slotted() styles are applied by the shadow root to light DOM content projected through <slot>',
        'CSS custom properties (variables) DO cross the shadow boundary — the primary design-token sharing mechanism',
        'Choose Shadow DOM when the Micro App must be framework-agnostic or will be embedded in multiple host environments',
        'Prefer CSS Modules when SSR, accessibility tooling integration, or tight React/Vue coupling is required',
      ],
      followUps: [
        'How do CSS custom properties cross the shadow boundary, and how do you use them for theming?',
        'What is the difference between open and closed shadow roots, and does it affect CSS isolation?',
        'How do you handle focus management and ARIA roles when wrapping a Micro App in a Custom Element?',
      ],
      rubric: {},
      tags: ['shadow-dom', 'web-components', 'css-encapsulation', 'micro-frontends'],
      sourceFile: 'custom',
      childExplanation: 'Shadow DOM is like a toy box with a lid. Toys inside the box can\'t jump out and mess up the living room, and the living room mess can\'t get into the box. But you can paint the outside of the lid (::part()) to match the room\'s color.',
      detailedExplanation: `<h4>How Shadow DOM Encapsulation Works</h4>
<p>When you attach a <strong>shadow root</strong> to an element via <code>element.attachShadow({ mode: 'open' })</code>, the browser creates an isolated DOM sub-tree. CSS rules in the outer document cannot reach inside, and styles declared inside the shadow root cannot reach outside.</p>

<pre><code>// Custom Element mounting a Micro App
class CheckoutApp extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    // styles here are scoped to shadow root only
    shadow.innerHTML = \`
      &lt;style&gt;.btn { background: var(--brand-primary, #0d7d72); }&lt;/style&gt;
      &lt;button class="btn"&gt;Pay Now&lt;/button&gt;
    \`;
  }
}
customElements.define('checkout-app', CheckoutApp);
</code></pre>

<h4>Theming Hooks: ::part() and CSS Custom Properties</h4>
<p>Two mechanisms let the host theme a shadow element without breaking isolation:</p>
<ul>
  <li><strong><code>::part()</code></strong> — The shadow element declares <code>part="submit-btn"</code>; the host styles it via <code>checkout-app::part(submit-btn) { color: red; }</code>. Only explicitly named parts are accessible.</li>
  <li><strong>CSS Custom Properties</strong> — Variables declared on the host element cascade into the shadow root. This is the standard way to pass design tokens.</li>
</ul>

<h4>Shadow DOM vs CSS Modules</h4>
<ul>
  <li><strong>Shadow DOM</strong>: Framework-agnostic, works in vanilla JS, Angular, or as a React wrapper. No build step. Best when the Micro App must work across different host frameworks or be published as a standalone component.</li>
  <li><strong>CSS Modules</strong>: Build-time hashing; integrates naturally with React/Vue SFCs. SSR-friendly. Better DX for teams already using a bundler.</li>
</ul>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>With <code>mode: 'closed'</code>, <code>element.shadowRoot</code> returns <code>null</code> from outside, making automated tests and debugging much harder. Use closed roots only for published third-party widgets that must hide internal implementation — not for your own Micro Apps.</p></div>

<blockquote>Senior Insight: CSS custom properties are the bridge between the isolation boundary and the design system. Define all theme tokens as custom properties on <code>:root</code> in the Shell; Shadow DOM Micro Apps pick them up automatically without any extra configuration.</blockquote>`,
      diagramSvg: svg2,
      quiz: {
        format: 'mcq',
        question: 'Which mechanism allows a host (Shell) to style a named element inside a Shadow DOM?',
        options: ['A CSS class override', '::part() with a named part attribute', ':deep() selector', 'CSS Modules composition'],
        answer: 1,
        explanation: '::part() is the only CSS selector that can pierce the shadow boundary — but only for elements that explicitly declare a part="..." attribute, giving the component author control over what can be themed.',
      },
    },

    {
      id: 'custom-micro-frontend-tailwind-shared-how-do-you-prevent-style-conflicts',
      topic: 'Frontend System Design',
      subtopic: 'CSS Isolation in Micro-Frontends',
      difficulty: 'senior',
      type: 'debugging',
      question: 'Your Shell App and three Micro Apps all use Tailwind CSS from the same shared design system bundle. How do you prevent CSS specificity conflicts and ensure consistent rendering across teams?',
      expectedPoints: [
        'Configure a per-app Tailwind prefix (prefix: "shell-", "mfe-checkout-") so class names never collide',
        'Use @layer to declare load order: base → shell-components → mfe-components ensures predictable specificity',
        'Avoid loading Tailwind base/reset in every app — deduplicate in the Shell or use a single shared CDN entry',
        'Use CSS custom properties for all design tokens so the design system\'s palette flows through one source of truth',
        'Configure Tailwind\'s content paths per app to prevent over-purging classes used by sibling apps',
        'Consider CSS @scope (baseline 2024) for per-section style scoping without class naming discipline',
      ],
      followUps: [
        'How does Module Federation\'s singleton pattern interact with Tailwind\'s CSS extraction?',
        'What is the risk of loading Tailwind twice — once via CDN and once via a bundled Micro App?',
        'How would you implement a dark-mode toggle that works across all Micro Apps simultaneously?',
      ],
      rubric: {},
      tags: ['tailwind', 'css-architecture', 'specificity', 'design-system', 'micro-frontends'],
      sourceFile: 'custom',
      childExplanation: 'Imagine four people are all painting different parts of a house using the same color set. If they all label their paint buckets "red", they might grab the wrong one. Adding name tags like "kitchen-red" and "bathroom-red" means no mix-ups — that\'s what Tailwind prefix does.',
      detailedExplanation: `<h4>The Problem: Shared Tailwind in Multiple Apps</h4>
<p>When several apps share Tailwind, three problems emerge:</p>
<ol>
  <li><strong>Class name collisions</strong> — Both Shell and a Micro App define <code>.bg-white</code>; whichever loads last wins.</li>
  <li><strong>Duplicate base styles</strong> — If each app loads <code>@tailwind base</code>, you get multiple global resets fighting each other.</li>
  <li><strong>Over-purging</strong> — Tailwind's content scanner only sees its own app's templates, so it may purge classes used by other apps.</li>
</ol>

<h4>Fix 1 — Tailwind Prefix Per App</h4>
<p>In each app's <code>tailwind.config.js</code>, set a unique prefix:</p>
<pre><code>// Shell
module.exports = { prefix: 'shell-', content: ['./src/shell/**/*.{ts,tsx}'] };

// Micro App: Checkout
module.exports = { prefix: 'mfe-co-', content: ['./src/checkout/**/*.{ts,tsx}'] };
</code></pre>
<p>Now <code>.bg-white</code> becomes <code>.shell-bg-white</code> and <code>.mfe-co-bg-white</code> — no collision possible.</p>

<h4>Fix 2 — @layer for Load-Order Independence</h4>
<p>Wrap each app's Tailwind output in a named <code>@layer</code>:</p>
<pre><code>/* shell.css */
@layer tailwind-base, shell, mfe-checkout, mfe-search;

@layer shell {
  @tailwind components;
  @tailwind utilities;
}
</code></pre>
<p>Layer order declared in the Shell's CSS gives deterministic precedence regardless of script injection order.</p>

<h4>Fix 3 — Single Base Reset</h4>
<p>Include <code>@tailwind base</code> <strong>only in the Shell</strong>. Micro Apps skip the base layer and only emit components + utilities. This prevents Norman-cumulative reset conflicts.</p>

<h4>Fix 4 — Design Tokens as CSS Custom Properties</h4>
<p>Centralise all colours, spacing, and typography as custom properties on <code>:root</code> (published by the Shell). Each app's Tailwind config points to these variables:</p>
<pre><code>// tailwind.config.js (shared preset)
theme: { colors: { brand: 'var(--color-brand)' } }
</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Configuring Tailwind's <code>content</code> paths to only cover one app's files means any class generated by a sibling app gets purged in production. Either use safelists, or configure Module Federation to emit CSS per-chunk and skip PurgeCSS on shared utility classes.</p></div>

<blockquote>Senior Insight: The cleanest solution for mature micro-frontend platforms is a published design-system package that exports a Tailwind preset (with tokens as CSS variables), a shared base reset loaded once by the Shell, and per-app prefix configs enforced by a lint rule. Teams stay autonomous while the visual layer stays coherent.</blockquote>`,
      diagramSvg: svg3,
      quiz: {
        format: 'mcq',
        question: 'Which Tailwind configuration setting prevents class name collisions between a Shell App and a Micro App that both use Tailwind?',
        options: ['content paths', 'prefix', '@layer', 'safelist'],
        answer: 1,
        explanation: 'Setting a unique `prefix` in each app\'s tailwind.config.js means class names are namespaced (e.g. shell-bg-white vs mfe-bg-white), making collisions impossible even if both apps load Tailwind.',
      },
    },
  ];
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

async function main() {
  // 1. Generate SVG diagrams
  const svg1 = renderDiagramSpec(Q1_DIAGRAM);
  const svg2 = renderDiagramSpec(Q2_DIAGRAM);
  const svg3 = renderDiagramSpec(Q3_DIAGRAM);

  const questions = buildQuestions([svg1, svg2, svg3]);

  // 2. Append to frontend-system-design.json
  const JSON_PATH = 'prisma/seed/questions/frontend-system-design.json';
  const existing: unknown[] = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const incomingIds = new Set(questions.map((q) => q.id));

  // Remove any old version of these questions if re-running
  const filtered = existing.filter((q: unknown) => !incomingIds.has((q as { id: string }).id));
  const merged = [...filtered, ...questions];

  writeFileSync(JSON_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`✓ Wrote ${questions.length} questions to ${JSON_PATH} (total: ${merged.length})`);

  // 3. Upsert directly to DB
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const q of questions) {
      await prisma.seedQuestion.upsert({
        where: { id: q.id },
        update: {
          topic: q.topic,
          subtopic: q.subtopic,
          difficulty: q.difficulty as 'senior',
          type: q.type as 'tradeoff' | 'conceptual' | 'debugging',
          question: q.question,
          expectedPoints: q.expectedPoints,
          followUps: q.followUps,
          rubric: q.rubric,
          tags: q.tags,
          sourceFile: q.sourceFile,
          childExplanation: q.childExplanation,
          detailedExplanation: q.detailedExplanation,
          diagramSvg: q.diagramSvg,
          diagramMermaid: null,
          quiz: JSON.stringify(q.quiz),
        },
        create: {
          id: q.id,
          topic: q.topic,
          subtopic: q.subtopic,
          difficulty: q.difficulty as 'senior',
          type: q.type as 'tradeoff' | 'conceptual' | 'debugging',
          question: q.question,
          expectedPoints: q.expectedPoints,
          followUps: q.followUps,
          rubric: q.rubric,
          tags: q.tags,
          sourceFile: q.sourceFile,
          childExplanation: q.childExplanation,
          detailedExplanation: q.detailedExplanation,
          diagramSvg: q.diagramSvg,
          diagramMermaid: null,
          quiz: JSON.stringify(q.quiz),
        },
      });

      const vb = q.diagramSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const dims = vb ? `${vb[1]}×${vb[2]}` : 'no viewBox';
      console.log(`  ✓ ${q.id.slice(0, 60)}  [${dims}]`);
    }
    console.log(`\n✅ Seeded ${questions.length} CSS isolation questions.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
