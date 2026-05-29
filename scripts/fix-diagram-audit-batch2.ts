/**
 * Batch-fixes diagram issues found in the second audit pass:
 *
 *  A) Cycle explosion (1848px) — service worker diagram
 *  B) Massive edge-label clusters (6–10 labels, fan-out/fan-in)
 *     — EOA vs Smart Contract, REST vs GraphQL, localStorage vs sessionStorage,
 *       HTTP/3 improvement, image formats, bundler comparison
 *  C) Identical-label fan-in ("reduces|reduces|reduces") — alert fatigue, hydration
 *  D) Same-band fan pattern 2→2 ("lower|higher|slower|faster") — CSR vs SSR trade-off
 *  E) Generic "affects" chain labels — state management, state classification
 *  F) Confusing cross-naming labels — CSR/SSR/SSG timeline
 *
 *  Fix strategy: remove all edge labels; encode context in node sublabels + caption.
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { renderDiagramSpec } from './diagram-spec-renderer';
import type { DiagramSpec } from './extract-seed-types';

loadEnv({ path: '.env.local' });

const FIXES: Array<{ idPrefix: string; label: string; spec: DiagramSpec }> = [

  // ── A: Service Worker — cycle explosion → de-cycled LR ──────────────────
  {
    idPrefix: 'fe-prep-2-where-does-the-service-worker-stand-how-does-a-service-worker-',
    label: 'Service Worker network flow',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'app',   label: 'Web App',        sublabel: 'browser page',           color: 'teal'   },
        { id: 'sw',    label: 'Service Worker',  sublabel: 'fetch interceptor',      color: 'blue'   },
        { id: 'net',   label: 'Network',         sublabel: 'remote server',          color: 'orange' },
        { id: 'cache', label: 'Cache API',       sublabel: 'cached responses',       color: 'purple' },
        { id: 'resp',  label: 'Response',        sublabel: 'served to page',         color: 'green'  },
      ],
      // net→cache stores the response; both sw→cache (hit) and cache→resp serve it
      // No back-edges → no cycle
      edges: [
        { from: 'app',   to: 'sw'    },
        { from: 'sw',    to: 'net'   },
        { from: 'sw',    to: 'cache' },
        { from: 'net',   to: 'cache' },
        { from: 'cache', to: 'resp'  },
      ],
      caption: 'SW checks cache first · on miss: fetch from network + store in cache',
    },
  },

  // ── B: Massive label clusters — fan-out/fan-in redesigns ────────────────

  {
    idPrefix: 'fun-xyz-prep-eoa-vs-smart-contract-wallet-what-are-the-key-differ',
    label: 'EOA vs Smart Contract Wallet',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'eoa',   label: 'EOA Wallet',      sublabel: 'externally owned acct',  color: 'blue'   },
        { id: 'sc',    label: 'Smart Contract',   sublabel: 'programmable wallet',    color: 'purple' },
        { id: 'auth',  label: 'Auth',             sublabel: 'priv. key vs multisig',  color: 'teal'   },
        { id: 'gas',   label: 'Gas Model',        sublabel: 'ETH req. vs paymaster',  color: 'orange' },
        { id: 'logic', label: 'Logic',            sublabel: 'fixed vs upgradeable',   color: 'green'  },
        { id: 'recov', label: 'Recovery',         sublabel: 'seed phrase vs social',  color: 'pink'   },
        { id: 'batch', label: 'Batching',         sublabel: 'single vs batch txns',   color: 'amber'  },
      ],
      edges: [
        { from: 'eoa', to: 'auth'  },
        { from: 'eoa', to: 'gas'   },
        { from: 'eoa', to: 'logic' },
        { from: 'eoa', to: 'recov' },
        { from: 'sc',  to: 'auth'  },
        { from: 'sc',  to: 'gas'   },
        { from: 'sc',  to: 'logic' },
        { from: 'sc',  to: 'recov' },
        { from: 'sc',  to: 'batch' },
      ],
      groups: [
        { label: 'EOA + SC share',  nodeIds: ['auth', 'gas', 'logic', 'recov'], color: 'teal'   },
        { label: 'SC only',         nodeIds: ['batch'],                          color: 'purple' },
      ],
      caption: 'EOA: simple key control · SC: gasless, social recovery, batch transactions',
    },
  },

  {
    idPrefix: 'fe-prep-2-rest-vs-graphql-rest-representational-state-transfer-an',
    label: 'REST vs GraphQL',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'rest',     label: 'REST',         sublabel: 'resource-based API',           color: 'teal'   },
        { id: 'gql',      label: 'GraphQL',       sublabel: 'query-based API',              color: 'purple' },
        { id: 'endpoints',label: 'Endpoints',     sublabel: 'multiple vs single /graphql',  color: 'blue'   },
        { id: 'fetch',    label: 'Fetching',      sublabel: 'over/under vs precise',        color: 'orange' },
        { id: 'cache',    label: 'Caching',       sublabel: 'HTTP cache vs app-level',      color: 'green'  },
        { id: 'version',  label: 'Versioning',    sublabel: 'URL-based vs schema evolution',color: 'pink'   },
      ],
      edges: [
        { from: 'rest', to: 'endpoints' },
        { from: 'rest', to: 'fetch'     },
        { from: 'rest', to: 'cache'     },
        { from: 'rest', to: 'version'   },
        { from: 'gql',  to: 'endpoints' },
        { from: 'gql',  to: 'fetch'     },
        { from: 'gql',  to: 'cache'     },
        { from: 'gql',  to: 'version'   },
      ],
      caption: 'REST: cacheable, familiar · GraphQL: flexible queries, avoids over-fetching',
    },
  },

  {
    idPrefix: 'fe-prep-2-choose-client-side-storage-what-are-the-key-differences-b',
    label: 'localStorage vs sessionStorage',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'ls',      label: 'localStorage',   sublabel: 'persistent storage',          color: 'teal'   },
        { id: 'ss',      label: 'sessionStorage',  sublabel: 'tab-scoped storage',          color: 'blue'   },
        { id: 'persist', label: 'Persistence',     sublabel: 'indefinite vs session-only',  color: 'orange' },
        { id: 'scope',   label: 'Scope',           sublabel: 'all tabs vs this tab only',   color: 'purple' },
        { id: 'security',label: 'Security',        sublabel: 'XSS risk — use HTTPS',        color: 'red'    },
        { id: 'usecase', label: 'Use Cases',       sublabel: 'prefs/tokens vs temp state',  color: 'green'  },
      ],
      edges: [
        { from: 'ls', to: 'persist'  },
        { from: 'ls', to: 'scope'    },
        { from: 'ls', to: 'security' },
        { from: 'ls', to: 'usecase'  },
        { from: 'ss', to: 'persist'  },
        { from: 'ss', to: 'scope'    },
        { from: 'ss', to: 'security' },
        { from: 'ss', to: 'usecase'  },
      ],
      caption: 'both sync, ~5 MB limit · never store sensitive tokens in either',
    },
  },

  {
    idPrefix: 'fe-prep-2-network-protocol-http-1-1-http-3-how-does-http-3-improv',
    label: 'HTTP/3 improvement over HTTP/1.1',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'h1',   label: 'HTTP/1.1',  sublabel: '1 req per TCP conn',      color: 'red'    },
        { id: 'h2',   label: 'HTTP/2',    sublabel: 'multiplexed over TCP',    color: 'orange' },
        { id: 'h3',   label: 'HTTP/3',    sublabel: 'QUIC-based protocol',     color: 'teal'   },
        { id: 'quic', label: 'QUIC',      sublabel: 'UDP + reliability layer', color: 'blue'   },
        { id: 'hol',  label: 'No HOL',    sublabel: 'streams independent',     color: 'purple' },
        { id: 'rtt',  label: '0-RTT',     sublabel: 'faster handshake',        color: 'green'  },
      ],
      edges: [
        { from: 'h1',   to: 'h2'   },
        { from: 'h2',   to: 'h3'   },
        { from: 'h3',   to: 'quic' },
        { from: 'quic', to: 'hol'  },
        { from: 'quic', to: 'rtt'  },
      ],
      caption: 'HTTP/3 uses QUIC (UDP) → eliminates TCP head-of-line blocking + faster reconnects',
    },
  },

  {
    idPrefix: 'fe-prep-2-image-formats-choose-the-right-one-how-do-you-decide-wh',
    label: 'Image format selection',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'q',    label: 'Image Format?', sublabel: 'format selection guide',     color: 'teal'   },
        { id: 'avif', label: 'AVIF',          sublabel: 'best quality/size (modern)', color: 'green'  },
        { id: 'webp', label: 'WebP',          sublabel: 'great support, small size',  color: 'blue'   },
        { id: 'svg',  label: 'SVG',           sublabel: 'vector / icons / logos',     color: 'purple' },
        { id: 'jpg',  label: 'JPEG',          sublabel: 'photos / no transparency',   color: 'orange' },
        { id: 'png',  label: 'PNG',           sublabel: 'lossless + transparency',    color: 'pink'   },
      ],
      edges: [
        { from: 'q', to: 'avif' },
        { from: 'q', to: 'webp' },
        { from: 'q', to: 'svg'  },
        { from: 'q', to: 'jpg'  },
        { from: 'q', to: 'png'  },
      ],
      caption: 'AVIF > WebP > JPEG for photos · PNG for lossless · SVG for scalable graphics',
    },
  },

  {
    idPrefix: 'fe-prep-2-bundler-comparison-webpack-vite-esbuild-rollup-how-do-w',
    label: 'Bundler comparison',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'q',      label: 'Bundler?',  sublabel: 'pick for your use case',    color: 'teal'   },
        { id: 'vite',   label: 'Vite',      sublabel: 'fast HMR / DX (ESM)',       color: 'orange' },
        { id: 'wp',     label: 'Webpack',   sublabel: 'complex apps, rich plugins', color: 'blue'  },
        { id: 'es',     label: 'esbuild',   sublabel: 'max build speed',           color: 'green'  },
        { id: 'rollup', label: 'Rollup',    sublabel: 'library tree-shaking',      color: 'purple' },
      ],
      edges: [
        { from: 'q', to: 'vite'   },
        { from: 'q', to: 'wp'     },
        { from: 'q', to: 'es'     },
        { from: 'q', to: 'rollup' },
      ],
      caption: 'Vite for apps · Rollup/esbuild for libraries · Webpack for legacy/complex ecosystems',
    },
  },

  // ── C: Identical "reduces" fan-in labels ────────────────────────────────

  {
    idPrefix: 'fe-prep-2-properly-using-alerts-combating-alert-fatigue-how-can-a',
    label: 'Alert fatigue reduction',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'vol',    label: 'Alert Volume',   sublabel: 'too many noisy alerts',    color: 'red'    },
        { id: 'filter', label: 'Filter Noise',   sublabel: 'percentile thresholds',    color: 'orange' },
        { id: 'triage', label: 'Triage',         sublabel: 'severity + actionability', color: 'blue'   },
        { id: 'route',  label: 'Route',          sublabel: 'right team + channel',     color: 'teal'   },
        { id: 'resolve',label: 'Fast Resolve',   sublabel: 'runbooks + context',       color: 'green'  },
      ],
      edges: [
        { from: 'vol',    to: 'filter'  },
        { from: 'filter', to: 'triage'  },
        { from: 'triage', to: 'route'   },
        { from: 'route',  to: 'resolve' },
      ],
      caption: 'reduce fatigue: noise filter → actionable triage → route → fast resolution',
    },
  },

  {
    idPrefix: 'fe-prep-2-hydration-modern-variants-how-can-modern-hydration-tech',
    label: 'Modern hydration techniques',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'full',   label: 'Full Hydration',  sublabel: 'all JS up front',        color: 'red'    },
        { id: 'stream', label: 'Streaming SSR',   sublabel: 'chunk HTML delivery',    color: 'orange' },
        { id: 'prog',   label: 'Progressive',     sublabel: 'hydrate by viewport',    color: 'blue'   },
        { id: 'islands',label: 'Islands Arch',    sublabel: 'isolate interactive UI', color: 'teal'   },
        { id: 'rsc',    label: 'Server Comps',    sublabel: 'zero client JS',         color: 'purple' },
        { id: 'tti',    label: 'Better TTI',      sublabel: 'faster interactivity',   color: 'green'  },
      ],
      edges: [
        { from: 'full',    to: 'stream'  },
        { from: 'stream',  to: 'prog'    },
        { from: 'prog',    to: 'islands' },
        { from: 'islands', to: 'rsc'     },
        { from: 'rsc',     to: 'tti'     },
      ],
      caption: 'progressive hydration evolution → smaller JS payload → faster Time to Interactive',
    },
  },

  // ── D: 2→2 fan pattern ("lower|higher|slower|faster") ───────────────────

  {
    idPrefix: 'fe-prep-2-always-mention-trade-off-questions-how-do-you-decide-be',
    label: 'CSR vs SSR trade-offs',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'csr',  label: 'CSR',         sublabel: 'client-side rendering',        color: 'orange' },
        { id: 'ssr',  label: 'SSR',         sublabel: 'server-side rendering',        color: 'teal'   },
        { id: 'seo',  label: 'SEO',         sublabel: 'CSR: poor / SSR: great',       color: 'blue'   },
        { id: 'ttl',  label: 'Load Time',   sublabel: 'CSR: slower TTFB / SSR: fast', color: 'red'    },
        { id: 'cplx', label: 'Complexity',  sublabel: 'CSR: simple / SSR: infra',     color: 'purple' },
        { id: 'perf', label: 'Performance', sublabel: 'CSR: JS cost / SSR: CPU cost', color: 'green'  },
      ],
      edges: [
        { from: 'csr', to: 'seo'  },
        { from: 'csr', to: 'ttl'  },
        { from: 'csr', to: 'cplx' },
        { from: 'csr', to: 'perf' },
        { from: 'ssr', to: 'seo'  },
        { from: 'ssr', to: 'ttl'  },
        { from: 'ssr', to: 'cplx' },
        { from: 'ssr', to: 'perf' },
      ],
      caption: 'SSR: faster TTFB + great SEO · CSR: simpler stack, better for interactive SPAs',
    },
  },

  // ── E: Generic "affects" label chains ───────────────────────────────────

  {
    idPrefix: 'fe-prep-frontend-system-design-state-management-when-to-use-local-stat',
    label: 'State management decision',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'local',   label: 'Local State',   sublabel: 'useState / useReducer',    color: 'teal'   },
        { id: 'context', label: 'Context API',   sublabel: 'avoid prop drilling',      color: 'blue'   },
        { id: 'lib',     label: 'State Library', sublabel: 'Redux / Zustand / Jotai',  color: 'purple' },
        { id: 'query',   label: 'Server Cache',  sublabel: 'React Query / SWR',        color: 'orange' },
      ],
      edges: [
        { from: 'local',   to: 'context' },
        { from: 'context', to: 'lib'     },
        { from: 'lib',     to: 'query'   },
      ],
      caption: 'choose the lightest solution: local → context → library → server cache',
    },
  },

  {
    idPrefix: 'fe-prep-2-state-classification-decision-diagram-how-do-you-decide-',
    label: 'State classification decision tree',
    spec: {
      direction: 'TD',
      nodes: [
        { id: 'q',      label: 'State Type?',    sublabel: 'where does it live?',          color: 'teal'   },
        { id: 'server', label: 'Server State',   sublabel: 'React Query / SWR (async)',    color: 'blue'   },
        { id: 'ui',     label: 'Client UI State',sublabel: 'useState / context (sync)',    color: 'orange' },
        { id: 'url',    label: 'URL State',      sublabel: 'query params / bookmarkable',  color: 'pink'   },
        { id: 'local',  label: 'Local State',    sublabel: 'single component only',        color: 'green'  },
        { id: 'global', label: 'Global State',   sublabel: 'many components / Zustand',    color: 'purple' },
      ],
      edges: [
        { from: 'q',  to: 'server' },
        { from: 'q',  to: 'ui'     },
        { from: 'q',  to: 'url'    },
        { from: 'ui', to: 'local'  },
        { from: 'ui', to: 'global' },
      ],
      caption: 'server state (async/cached) is separate from client state (sync/reactive)',
    },
  },

  // ── F: Confusing cross-naming labels ────────────────────────────────────

  {
    idPrefix: 'fe-prep-2-visually-compare-the-timeline-what-are-the-key-differen',
    label: 'CSR/SSR/SSG rendering timeline',
    spec: {
      direction: 'TD',
      nodes: [
        { id: 'csr',     label: 'CSR',              sublabel: 'JS renders in browser',     color: 'orange' },
        { id: 'ssr',     label: 'SSR',              sublabel: 'server renders per request', color: 'teal'  },
        { id: 'ssg',     label: 'SSG',              sublabel: 'HTML built at compile time', color: 'blue'  },
        { id: 'tti',     label: 'Time to Interactive',sublabel: 'CSR: slow / SSR: med / SSG: fast', color: 'green'  },
        { id: 'seo',     label: 'SEO',              sublabel: 'CSR: poor / SSR: good / SSG: best', color: 'purple' },
        { id: 'hydrate', label: 'Hydration',        sublabel: 'CSR: full / SSR: needed / SSG: min', color: 'pink'  },
      ],
      edges: [
        { from: 'csr', to: 'tti'     },
        { from: 'csr', to: 'seo'     },
        { from: 'csr', to: 'hydrate' },
        { from: 'ssr', to: 'tti'     },
        { from: 'ssr', to: 'seo'     },
        { from: 'ssr', to: 'hydrate' },
        { from: 'ssg', to: 'tti'     },
        { from: 'ssg', to: 'seo'     },
        { from: 'ssg', to: 'hydrate' },
      ],
      caption: 'SSG: best static perf + SEO · SSR: dynamic + SEO · CSR: SPA / rich apps',
    },
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    let applied = 0;
    for (const fix of FIXES) {
      const q = await prisma.seedQuestion.findFirst({
        where: { id: { startsWith: fix.idPrefix } },
        select: { id: true },
      });
      if (!q) { console.log(`⚠ NOT FOUND: ${fix.idPrefix.slice(0, 60)}`); continue; }

      const svg = renderDiagramSpec(fix.spec);
      const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const dims = vb ? `${vb[1]}×${vb[2]}` : 'no viewBox';

      await prisma.seedQuestion.update({
        where: { id: q.id },
        data: { diagramSvg: svg },
      });
      console.log(`✓ ${fix.label.padEnd(36)} ${dims}`);
      applied++;
    }
    console.log(`\n✅ Fixed ${applied} / ${FIXES.length} diagrams.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(console.error);
