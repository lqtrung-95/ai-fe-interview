/**
 * Generates 35 new niche mid/senior/staff-level questions for the question bank.
 *
 * Each question is fully populated:
 *   childExplanation · detailedExplanation (HTML, 5-ladder) · quiz · expectedPoints · followUps
 *
 * Usage:
 *   pnpm generate:questions
 *   pnpm generate:questions --dry-run
 *   pnpm generate:questions --from 10        (start at index 10, skip first 9)
 *   pnpm generate:questions --id "virtual-scrolling"  (single topic by key)
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import OpenAI from 'openai';

loadEnv({ path: '.env.local' });

const SEED_DIR = 'prisma/seed/questions';
const DELAY_MS = 1500;

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const fromIdx = (() => {
  const i = args.indexOf('--from');
  return i !== -1 ? parseInt(args[i + 1], 10) - 1 : 0;
})();
const singleKey = (() => {
  const i = args.indexOf('--id');
  return i !== -1 ? args[i + 1] : null;
})();

// ── LLM setup ─────────────────────────────────────────────────────────────────

function getLLMConfig() {
  const p = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (p === 'deepseek') {
    const k = process.env.DEEPSEEK_API_KEY;
    if (!k || k === 'placeholder') throw new Error('DEEPSEEK_API_KEY missing');
    return { apiKey: k, baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' };
  }
  if (p === 'groq') {
    const k = process.env.GROQ_API_KEY;
    if (!k || k === 'placeholder') throw new Error('GROQ_API_KEY missing');
    return { apiKey: k, baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' };
  }
  const k = process.env.OPENAI_API_KEY;
  if (!k || k === 'placeholder') throw new Error('OPENAI_API_KEY missing');
  return { apiKey: k, model: 'gpt-4o' };
}

// ── Question specs ─────────────────────────────────────────────────────────────

interface QuestionSpec {
  key: string;
  file: string;
  topic: string;
  subtopic: string;
  difficulty: 'mid' | 'senior';
  type: 'conceptual' | 'system_design' | 'tradeoff';
  question: string;
  tags: string[];
}

const QUESTIONS: QuestionSpec[] = [
  // React deep-dives
  {
    key: 'react-suspense-concurrent',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚛️ Suspense & Concurrent Rendering',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How do React Suspense and concurrent features like useTransition change how you architect data-fetching and UI responsiveness?',
    tags: ['react', 'suspense', 'concurrent', 'useTransition'],
  },
  {
    key: 'react-error-boundaries',
    file: 'react.json',
    topic: 'React',
    subtopic: '🚨 Error Boundaries Architecture',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design an error boundary strategy for a large React application to isolate failures without degrading the full page?',
    tags: ['react', 'error-handling', 'resilience'],
  },
  {
    key: 'react-hydration-deep-dive',
    file: 'react.json',
    topic: 'React',
    subtopic: '💧 Hydration Errors & Selective Hydration',
    difficulty: 'senior',
    type: 'system_design',
    question: 'What causes React hydration mismatches, how do you diagnose them, and how does React 18 selective hydration change the recovery strategy?',
    tags: ['react', 'ssr', 'hydration'],
  },
  {
    key: 'react-query-internals',
    file: 'react.json',
    topic: 'React',
    subtopic: '🔄 TanStack Query — Cache Architecture',
    difficulty: 'senior',
    type: 'conceptual',
    question: 'How does TanStack Query manage its query cache, stale time, and background refetching — and how do you tune these for a high-traffic dashboard?',
    tags: ['react-query', 'caching', 'data-fetching'],
  },
  {
    key: 'zustand-vs-redux',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚡ Zustand vs Redux Toolkit',
    difficulty: 'mid',
    type: 'tradeoff',
    question: 'What are the concrete architectural trade-offs between Zustand and Redux Toolkit, and when should a team choose one over the other?',
    tags: ['state-management', 'zustand', 'redux'],
  },
  // Browser & Web APIs
  {
    key: 'web-workers-offloading',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '🧵 Web Workers — Main Thread Offloading',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a system to offload CPU-intensive work from the main thread using Web Workers, and what are the serialization and communication trade-offs?',
    tags: ['web-workers', 'performance', 'concurrency'],
  },
  {
    key: 'shadow-dom-web-components',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '🌑 Shadow DOM & Custom Elements',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How do Shadow DOM and Custom Elements enable widget isolation in a third-party SDK, and what are the limitations compared to iframes?',
    tags: ['shadow-dom', 'web-components', 'sdk', 'isolation'],
  },
  {
    key: 'content-security-policy',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '🔒 Content Security Policy (CSP)',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design and implement a strict Content Security Policy for a complex web application that uses third-party scripts and inline styles?',
    tags: ['security', 'csp', 'xss'],
  },
  {
    key: 'font-loading-strategy',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '🔤 Font Loading Strategy',
    difficulty: 'mid',
    type: 'system_design',
    question: 'How do you eliminate layout shift and invisible-text flash caused by web fonts, and what is the optimal loading strategy for a performance-critical site?',
    tags: ['fonts', 'performance', 'cls', 'fout'],
  },
  {
    key: 'intersection-observer',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '👁 Intersection Observer — Lazy Loading & Analytics',
    difficulty: 'mid',
    type: 'system_design',
    question: 'How would you use the Intersection Observer API to implement lazy loading, infinite scroll, and impression tracking without scroll event listeners?',
    tags: ['intersection-observer', 'lazy-loading', 'analytics'],
  },
  {
    key: 'third-party-scripts',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '📦 Third-Party Script Management',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a strategy to load, monitor, and sandbox third-party scripts (analytics, chat widgets, tag managers) without hurting Core Web Vitals?',
    tags: ['performance', 'third-party', 'scripts', 'tag-manager'],
  },
  {
    key: 'browser-storage-deep-dive',
    file: 'browser-and-web-apis.json',
    topic: 'Browser & Web APIs',
    subtopic: '🗄 Browser Storage Comparison',
    difficulty: 'mid',
    type: 'tradeoff',
    question: 'How do you choose between cookies, localStorage, sessionStorage, and IndexedDB for different data persistence needs, and what are the security implications of each?',
    tags: ['storage', 'cookies', 'indexeddb', 'security'],
  },
  // Web Performance
  {
    key: 'virtual-scrolling',
    file: 'web-performance.json',
    topic: 'Web Performance',
    subtopic: '🔁 Virtual Scrolling — Windowing Algorithm',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you implement virtual scrolling from scratch for a list with 100,000 rows, including support for variable row heights and dynamic content?',
    tags: ['virtual-scroll', 'performance', 'rendering'],
  },
  {
    key: 'skeleton-screens',
    file: 'web-performance.json',
    topic: 'Web Performance',
    subtopic: '💀 Skeleton Screens & Progressive Loading',
    difficulty: 'mid',
    type: 'system_design',
    question: 'How do you design a progressive loading system using skeleton screens, optimistic rendering, and streaming to minimise perceived latency across all network speeds?',
    tags: ['ux', 'loading', 'skeleton', 'streaming'],
  },
  {
    key: 'css-in-js-tradeoffs',
    file: 'web-performance.json',
    topic: 'Web Performance',
    subtopic: '💅 CSS-in-JS — Runtime vs Build-Time',
    difficulty: 'senior',
    type: 'tradeoff',
    question: 'What are the runtime performance costs of CSS-in-JS libraries like styled-components, and how do zero-runtime alternatives like Linaria or vanilla-extract change the trade-off?',
    tags: ['css', 'styled-components', 'performance', 'css-in-js'],
  },
  {
    key: 'micro-interactions-flip',
    file: 'web-performance.json',
    topic: 'Web Performance',
    subtopic: '✨ FLIP Animation Technique',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you implement performant list reordering and shared-element transitions using the FLIP (First, Last, Invert, Play) animation technique?',
    tags: ['animation', 'performance', 'flip', 'css'],
  },
  {
    key: 'css-containment',
    file: 'web-performance.json',
    topic: 'Web Performance',
    subtopic: '📦 CSS Containment & Compositing Layers',
    difficulty: 'senior',
    type: 'conceptual',
    question: 'How do CSS containment, will-change, and GPU compositing layers affect browser rendering performance, and when does promoting a layer become counterproductive?',
    tags: ['css', 'rendering', 'performance', 'compositing'],
  },
  // Frontend System Design
  {
    key: 'feature-flags-architecture',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🚩 Feature Flags Architecture',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a feature flag system supporting gradual rollouts, kill switches, and targeting rules — without re-deployment or page refresh?',
    tags: ['feature-flags', 'rollout', 'experiment'],
  },
  {
    key: 'ab-testing-infrastructure',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🧪 A/B Testing Infrastructure',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design the frontend infrastructure for an A/B testing platform that ensures consistent variant assignment, avoids flickering, and tracks statistical significance?',
    tags: ['ab-testing', 'experimentation', 'analytics'],
  },
  {
    key: 'edge-computing-frontend',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '⚡ Edge Functions for Frontend',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you use edge functions (Cloudflare Workers, Vercel Edge) to handle authentication, personalisation, and A/B testing without a full origin server round-trip?',
    tags: ['edge', 'cloudflare-workers', 'performance', 'ssr'],
  },
  {
    key: 'graphql-subscriptions',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '📡 GraphQL Subscriptions & Real-Time',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a GraphQL subscription system for live dashboard data, including connection management, cache integration, and fallback to polling?',
    tags: ['graphql', 'subscriptions', 'real-time', 'websocket'],
  },
  {
    key: 'optimistic-ui-rollback',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🔄 Optimistic UI with Conflict Rollback',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design an optimistic update system for a social feed — handling rollback, conflict resolution, and partial failures without jarring UX?',
    tags: ['optimistic-ui', 'state-management', 'resilience'],
  },
  {
    key: 'code-splitting-architecture',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '✂️ Code Splitting Architecture',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a code splitting strategy for a large React SPA to minimise initial bundle, optimise chunk reuse, and avoid waterfall loading on navigation?',
    tags: ['code-splitting', 'webpack', 'performance', 'bundling'],
  },
  {
    key: 'react-server-components-deep',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🖥 React Server Components — Mental Model',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How do React Server Components change the client/server boundary, data-fetching architecture, and bundle size compared to traditional SSR and client-side rendering?',
    tags: ['rsc', 'next.js', 'ssr', 'server-components'],
  },
  {
    key: 'streaming-ssr',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🌊 Streaming SSR with Suspense Boundaries',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How does React 18 streaming SSR differ from traditional SSR, and how do you decide which content to stream vs block on — including the impact on FCP and TTFB?',
    tags: ['streaming', 'ssr', 'react-18', 'suspense'],
  },
  {
    key: 'pwa-push-notifications',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '📱 PWA — Offline, Installability & Push',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a PWA with reliable offline support, app installability, and push notifications — covering the service worker lifecycle and iOS/Android platform differences?',
    tags: ['pwa', 'service-worker', 'push', 'offline'],
  },
  {
    key: 'design-system-versioning',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🏷 Design System Versioning & Breaking Changes',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you manage versioning, breaking changes, and cross-team migration in a shared design system consumed by 20+ product teams in a monorepo?',
    tags: ['design-system', 'versioning', 'monorepo', 'semver'],
  },
  {
    key: 'trpc-type-safe-api',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🔗 tRPC — End-to-End Type Safety',
    difficulty: 'senior',
    type: 'tradeoff',
    question: 'How does tRPC achieve end-to-end type safety without a schema file, and when is it preferable to REST+OpenAPI or GraphQL?',
    tags: ['trpc', 'typescript', 'api-design', 'type-safety'],
  },
  {
    key: 'real-time-presence',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '👥 Real-Time Presence & Collaborative Cursors',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design a real-time presence system showing live user cursors, active selections, and avatar indicators in a collaborative editor at scale?',
    tags: ['real-time', 'collaboration', 'presence', 'websocket'],
  },
  {
    key: 'internationalization-rtl',
    file: 'frontend-system-design.json',
    topic: 'Frontend System Design',
    subtopic: '🌍 Internationalisation — RTL, Plurals, Formatting',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design an internationalisation system for a React app supporting RTL languages, ICU plural rules, and locale-aware date/number/currency formatting?',
    tags: ['i18n', 'rtl', 'l10n', 'accessibility'],
  },
  // JavaScript core
  {
    key: 'memory-leaks-js',
    file: 'javascript.json',
    topic: 'JavaScript',
    subtopic: '🧹 Memory Leaks — Detection & Prevention',
    difficulty: 'senior',
    type: 'system_design',
    question: 'What are the most common sources of memory leaks in JavaScript and React applications, how do you detect them with Chrome DevTools, and how do WeakRef and FinalizationRegistry help?',
    tags: ['memory', 'performance', 'debugging', 'weakref'],
  },
  {
    key: 'service-worker-strategies',
    file: 'javascript.json',
    topic: 'JavaScript',
    subtopic: '⚙️ Service Worker Caching Strategies',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How do you choose between Cache-First, Network-First, Stale-While-Revalidate, and Network-Only strategies in a Service Worker, and how do you handle cache versioning and invalidation?',
    tags: ['service-worker', 'caching', 'pwa', 'offline'],
  },
  {
    key: 'indexeddb-offline-first',
    file: 'javascript.json',
    topic: 'JavaScript',
    subtopic: '🗃 IndexedDB & Offline-First Sync',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How would you design an offline-first data layer using IndexedDB with background sync — including conflict resolution when the client reconnects after hours offline?',
    tags: ['indexeddb', 'offline', 'sync', 'conflict-resolution'],
  },
  {
    key: 'promise-microtask-queue',
    file: 'javascript.json',
    topic: 'JavaScript',
    subtopic: '⏱ Promise Microtask Queue vs Task Queue',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'How does the JavaScript microtask queue differ from the macrotask queue, and how does this affect the execution order of Promises, queueMicrotask, setTimeout, and MutationObserver?',
    tags: ['event-loop', 'microtask', 'promise', 'async'],
  },
  {
    key: 'proxy-reflect-meta',
    file: 'javascript.json',
    topic: 'JavaScript',
    subtopic: '🪞 Proxy & Reflect — Metaprogramming',
    difficulty: 'senior',
    type: 'conceptual',
    question: 'How do JavaScript Proxy and Reflect enable reactive state, validation layers, and access control — and what are the performance costs at scale?',
    tags: ['proxy', 'reflect', 'metaprogramming', 'reactive'],
  },

  // ── React 18 & 19 new features ───────────────────────────────────────────────
  {
    key: 'react18-automatic-batching',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚛️ React 18 — Automatic Batching',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What is automatic batching in React 18, how does it differ from React 17 batching, and when would you need to opt out with flushSync?',
    tags: ['react18', 'batching', 'rendering', 'performance'],
  },
  {
    key: 'react18-createroot-migration',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚛️ React 18 — createRoot API',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What does React 18\'s createRoot API unlock compared to legacy ReactDOM.render(), and what is the migration path for an existing app?',
    tags: ['react18', 'createroot', 'migration', 'concurrent'],
  },
  {
    key: 'react18-usetransition',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚡ Concurrent — useTransition',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'Explain React 18\'s useTransition hook: what problem it solves, how the concurrent scheduler handles non-urgent updates, and how isPending drives UX.',
    tags: ['react18', 'useTransition', 'concurrent', 'ux'],
  },
  {
    key: 'react18-usedeferredvalue',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚡ Concurrent — useDeferredValue',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What is useDeferredValue in React 18, how does it keep UI responsive for expensive derived computations, and when should you prefer it over useTransition?',
    tags: ['react18', 'useDeferredValue', 'concurrent', 'performance'],
  },
  {
    key: 'react18-transition-vs-deferred',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚡ Concurrent Features — Tradeoffs',
    difficulty: 'senior',
    type: 'tradeoff',
    question: 'Compare useTransition and useDeferredValue: when do you own the state update vs receive a value, how do their loading signals differ, and can they be combined?',
    tags: ['react18', 'useTransition', 'useDeferredValue', 'tradeoff'],
  },
  {
    key: 'react18-useid',
    file: 'react.json',
    topic: 'React',
    subtopic: '♿ Accessibility — useId',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What is the useId hook in React 18, what SSR hydration problem does it solve compared to Math.random(), and what are valid vs invalid use cases?',
    tags: ['react18', 'useId', 'accessibility', 'ssr'],
  },
  {
    key: 'react18-usesynexternalstore',
    file: 'react.json',
    topic: 'React',
    subtopic: '🔄 External Store — useSyncExternalStore',
    difficulty: 'senior',
    type: 'conceptual',
    question: 'What is useSyncExternalStore, what is "tearing" in concurrent React, and how does this hook guarantee a consistent snapshot from external stores?',
    tags: ['react18', 'useSyncExternalStore', 'tearing', 'state'],
  },
  {
    key: 'react18-streaming-ssr',
    file: 'react.json',
    topic: 'React',
    subtopic: '🌊 Streaming SSR with Suspense',
    difficulty: 'senior',
    type: 'system_design',
    question: 'How does React 18 streaming SSR with renderToPipeableStream and Suspense improve TTFB, FCP, and TTI compared to the legacy renderToString approach?',
    tags: ['react18', 'ssr', 'streaming', 'performance'],
  },
  {
    key: 'react19-react-compiler',
    file: 'react.json',
    topic: 'React',
    subtopic: '🔧 React 19 — React Compiler',
    difficulty: 'senior',
    type: 'conceptual',
    question: 'What does the React Compiler do at build time, which manual memoization patterns does it replace, and what code patterns prevent it from optimising a component?',
    tags: ['react19', 'compiler', 'memoization', 'build-time'],
  },
  {
    key: 'react19-useactionstate',
    file: 'react.json',
    topic: 'React',
    subtopic: '📝 React 19 — Actions & useActionState',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What is useActionState in React 19, what boilerplate does it eliminate, and how does it integrate with Server Actions and progressive enhancement?',
    tags: ['react19', 'useActionState', 'forms', 'server-actions'],
  },
  {
    key: 'react19-useformstatus',
    file: 'react.json',
    topic: 'React',
    subtopic: '📝 React 19 — useFormStatus',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What does useFormStatus return, why must it be called in a child of a form element, and how does it eliminate prop-drilling for submit button state?',
    tags: ['react19', 'useFormStatus', 'forms', 'ux'],
  },
  {
    key: 'react19-useoptimistic',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚡ React 19 — useOptimistic',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'How does useOptimistic in React 19 work, how does it automatically roll back on error, and how does it compare to manually managing optimistic state?',
    tags: ['react19', 'useOptimistic', 'optimistic-ui', 'ux'],
  },
  {
    key: 'react19-use-hook',
    file: 'react.json',
    topic: 'React',
    subtopic: '🪝 React 19 — use() Hook',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'What can the use() hook read in React 19, why can it be called conditionally unlike other hooks, and how does it integrate with Suspense for Promises?',
    tags: ['react19', 'use', 'suspense', 'promises'],
  },
  {
    key: 'react19-ref-as-prop',
    file: 'react.json',
    topic: 'React',
    subtopic: '⚛️ React 19 — ref as Prop',
    difficulty: 'mid',
    type: 'conceptual',
    question: 'How did ref handling change in React 19 — why was forwardRef needed before, what does the new ref-as-prop model enable, and what is the new ref cleanup API?',
    tags: ['react19', 'ref', 'forwardRef', 'dom'],
  },
  {
    key: 'react19-server-actions',
    file: 'react.json',
    topic: 'React',
    subtopic: '🖥️ React 19 — Server Actions Security',
    difficulty: 'senior',
    type: 'system_design',
    question: 'What are Server Actions in React 19, how are they exposed as HTTP endpoints under the hood, and what security mistakes must you avoid?',
    tags: ['react19', 'server-actions', 'security', 'mutations'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(key: string): string {
  return `new-prep-${key}`;
}

function lqPrefix(key: string): string {
  return createHash('md5').update(key).digest('hex').slice(0, 6);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ladderCount(html: string): number {
  return (html.match(/lq-item/g) ?? []).length;
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a senior staff-level frontend engineer writing technical interview preparation content at the level of Google/Meta/Stripe.

Return ONLY valid JSON — no markdown fences, no extra text.

The JSON object must have exactly these keys:
  "childExplanation"    — string, 2-3 sentences, ELI-5 analogy for a 5-year-old
  "detailedExplanation" — string, rich HTML (see format below), ~7000-9000 chars
  "expectedPoints"      — array of 5 strings, what the interviewer checks for
  "followUps"           — array of 3 strings, natural follow-up questions
  "quiz"                — object: { format:"mcq", question, options:[4 strings], answer:0-3, explanation }

=== detailedExplanation HTML FORMAT ===

The HTML must contain (in this order):
1. 3–5 <h4> sections, each covering a distinct technical subtopic
2. <p> paragraphs, <ul><li> lists
3. At least 2 <pre><code> blocks with realistic, production-quality code
4. <code> inline for API names, method calls, property names
5. <kbd> for keyboard shortcuts if relevant
6. Specific numbers: latency (ms), sizes (bytes/KB), thresholds — real benchmark ranges
7. ONE <div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>…</p></div>
8. ONE <blockquote> starting with "Senior signal:" — a nuanced insight juniors miss
9. ONE <div class="ladder"> with EXACTLY 5 <li class="lq-item"> entries

=== LADDER FORMAT (copy exactly, replace QTEXT/ATEXT/PREFIX/N) ===
<div class="ladder"><span class="label">🪜 Deep Dive Ladder — Self-Interview</span><p>Answer before expanding.</p><ol class="ladder-list">
<li class="lq-item"><div class="lq-row"><span class="ln">1</span><span class="lq-text">QTEXT</span><button class="lq-toggle" data-target="lq-PREFIX-0" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-PREFIX-0" hidden=""><div class="lq-ans-inner">ATEXT</div></div></li>
...repeat for N=1,2,3,4
</ol></div>

Ladder question depth progression:
- Items 1-2: how it works internally (mechanisms, APIs, data structures)
- Items 3-4: edge cases, failure modes, scale/performance concerns
- Item 5: cross-cutting concern (security, observability, team process, backward compat)

=== CRITICAL RULES ===
- HTML entities in code: > = &gt;  < = &lt;  & = &amp;
- Ladder answer: 2-5 sentences, technically dense
- No company names (Fun.xyz, Binance, Google, Meta, etc.)
- No vague filler sentences — every sentence carries technical signal
- Target 7000-9000 chars for detailedExplanation`;
}

function buildUserPrompt(spec: QuestionSpec, prefix: string): string {
  return `Generate content for this interview question:

Topic: ${spec.topic}
Subtopic: ${spec.subtopic}
Difficulty: ${spec.difficulty}
Question: ${spec.question}
Tags: ${spec.tags.join(', ')}

Use lq-${prefix}-0 through lq-${prefix}-4 for the 5 ladder item IDs.

Return ONLY the JSON object with keys: childExplanation, detailedExplanation, expectedPoints, followUps, quiz`;
}

// ── JSON sanitizer ────────────────────────────────────────────────────────────

/**
 * DeepSeek sometimes emits literal newlines/tabs inside JSON string values,
 * producing invalid JSON. This walks the raw string character-by-character and
 * escapes control chars only when inside a JSON string literal.
 */
function sanitizeJsonControlChars(raw: string): string {
  let inStr = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const code = raw.charCodeAt(i);
    if (escaped) { out += c; escaped = false; continue; }
    if (c === '\\' && inStr) { out += c; escaped = true; continue; }
    if (c === '"') { inStr = !inStr; out += c; continue; }
    if (inStr && code < 0x20) {
      if (c === '\n') out += '\\n';
      else if (c === '\r') out += '\\r';
      else if (c === '\t') out += '\\t';
      else out += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }
    out += c;
  }
  return out;
}

// ── Generation ────────────────────────────────────────────────────────────────

interface GeneratedContent {
  childExplanation: string;
  detailedExplanation: string;
  expectedPoints: string[];
  followUps: string[];
  quiz: Record<string, unknown>;
}

async function generateQuestion(
  client: OpenAI,
  model: string,
  spec: QuestionSpec,
): Promise<GeneratedContent | null> {
  const prefix = lqPrefix(spec.key);
  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 5000,
      temperature: 0.4,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(spec, prefix) },
      ],
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? '';
    if (!raw) return null;

    const parsed = JSON.parse(sanitizeJsonControlChars(raw)) as GeneratedContent;

    // Validate
    if (!parsed.detailedExplanation || !parsed.childExplanation) {
      console.warn('  [warn] missing required fields');
      return null;
    }
    if (ladderCount(parsed.detailedExplanation) < 5) {
      console.warn(`  [warn] only ${ladderCount(parsed.detailedExplanation)} ladder items`);
      return null;
    }
    if (!Array.isArray(parsed.expectedPoints) || parsed.expectedPoints.length < 3) {
      console.warn('  [warn] missing expectedPoints');
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('  [err]', (err as Error).message);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const cfg = getLLMConfig();
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });

  console.log(`\n▶ Generating new questions`);
  console.log(`  Provider: ${(process.env.LLM_PROVIDER ?? 'openai')} / ${cfg.model}`);
  if (DRY_RUN) console.log('  [DRY RUN — no writes]');
  console.log();

  // Filter targets
  let targets = QUESTIONS.slice(fromIdx);
  if (singleKey) {
    targets = QUESTIONS.filter((q) => q.key === singleKey);
    if (targets.length === 0) {
      console.log(`No question found with key: ${singleKey}`);
      return;
    }
  }

  console.log(`  ${targets.length} questions to generate\n`);

  // Load all seed files into memory
  const fileCache = new Map<string, unknown[]>();
  const loadFile = (fname: string): unknown[] => {
    if (!fileCache.has(fname)) {
      fileCache.set(fname, JSON.parse(readFileSync(`${SEED_DIR}/${fname}`, 'utf-8')) as unknown[]);
    }
    return fileCache.get(fname)!;
  };

  // DB connection
  let prisma: PrismaClient | null = null;
  if (!DRY_RUN) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    prisma = new PrismaClient({ adapter });
  }

  let created = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const spec = targets[i];
    const qid = makeId(spec.key);

    console.log(`[${fromIdx + i + 1}/${fromIdx + targets.length}] ${spec.question.slice(0, 70)}`);
    console.log(`  key: ${spec.key}  →  id: ${qid}`);

    if (!DRY_RUN) {
      const content = await generateQuestion(client, cfg.model, spec);

      if (!content) {
        console.log('  ✗ failed\n');
        failed++;
        if (i < targets.length - 1) await sleep(DELAY_MS);
        continue;
      }

      const row = {
        id: qid,
        topic: spec.topic,
        subtopic: spec.subtopic,
        difficulty: spec.difficulty,
        type: spec.type,
        question: spec.question,
        expectedPoints: content.expectedPoints,
        followUps: content.followUps,
        rubric: {},
        tags: spec.tags,
        sourceFile: 'generated-new-questions',
        childExplanation: content.childExplanation,
        detailedExplanation: content.detailedExplanation,
        diagramSvg: null,
        diagramMermaid: null,
        quiz: JSON.stringify(content.quiz),
      };

      // Append to JSON file
      const rows = loadFile(spec.file) as typeof row[];
      const existingIdx = rows.findIndex((r) => r.id === qid);
      if (existingIdx !== -1) {
        rows[existingIdx] = row;
      } else {
        rows.push(row);
      }
      writeFileSync(`${SEED_DIR}/${spec.file}`, JSON.stringify(rows, null, 2), 'utf-8');

      // Upsert to DB
      await prisma!.seedQuestion.upsert({
        where: { id: qid },
        create: {
          id: qid,
          topic: spec.topic,
          subtopic: spec.subtopic,
          difficulty: spec.difficulty as 'mid',
          type: spec.type as 'conceptual',
          question: spec.question,
          expectedPoints: content.expectedPoints,
          followUps: content.followUps,
          rubric: {},
          tags: spec.tags,
          sourceFile: 'generated-new-questions',
          childExplanation: content.childExplanation,
          detailedExplanation: content.detailedExplanation,
          quiz: JSON.stringify(content.quiz),
        },
        update: {
          detailedExplanation: content.detailedExplanation,
          childExplanation: content.childExplanation,
          expectedPoints: content.expectedPoints,
          followUps: content.followUps,
          quiz: JSON.stringify(content.quiz),
        },
      });

      console.log(`  ✓ ${content.detailedExplanation.length} chars, ${ladderCount(content.detailedExplanation)} ladders\n`);
      created++;
    } else {
      console.log('  [dry-run]\n');
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  if (prisma) await prisma.$disconnect();
  console.log(`\n✓ Done: ${created} created, ${failed} failed out of ${targets.length} targets`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
