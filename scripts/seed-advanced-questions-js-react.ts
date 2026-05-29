/**
 * Advanced seed batch — Part 1: JavaScript (5) + React (5)
 * Usage: pnpm tsx scripts/seed-advanced-questions-js-react.ts
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { renderDiagramSpec } from './diagram-spec-renderer';
import type { DiagramSpec } from './extract-seed-types';

loadEnv({ path: '.env.local' });

/* ── Shared helper ── */
function upsertJson(filePath: string, questions: object[]) {
  const existing: { id: string }[] = JSON.parse(readFileSync(filePath, 'utf8'));
  const ids = new Set(questions.map((q: any) => q.id));
  const merged = [...existing.filter((q) => !ids.has(q.id)), ...questions];
  writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  return merged.length;
}

/* ═══════════════════════════════════════════════════════════════════
   JAVASCRIPT QUESTIONS
═══════════════════════════════════════════════════════════════════ */

const GEN_SPEC: DiagramSpec = {
  direction: 'TD',
  nodes: [
    { id: 'c1', label: 'gen.next()',       sublabel: '1st call · starts execution',       color: 'teal'   },
    { id: 'y1', label: 'yield "first"',    sublabel: '{value:"first", done:false}',        color: 'orange' },
    { id: 'c2', label: 'gen.next(input)',  sublabel: 'resumes · input received inside',    color: 'teal'   },
    { id: 'y2', label: 'yield "second"',   sublabel: '{value:"second", done:false}',       color: 'orange' },
    { id: 'ret', label: 'return',          sublabel: '{value:undefined, done:true}',       color: 'green'  },
  ],
  edges: [
    { from: 'c1', to: 'y1' },
    { from: 'y1', to: 'c2' },
    { from: 'c2', to: 'y2' },
    { from: 'y2', to: 'ret' },
  ],
  caption: 'execution pauses at yield · resumes on .next() · values flow both ways',
};

const PROXY_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'code',    label: 'User Code',       sublabel: 'proxy.age = 30',                     color: 'teal'   },
    { id: 'trap',    label: 'set trap',         sublabel: 'handler.set(target, key, value)',     color: 'orange' },
    { id: 'logic',   label: 'Custom Logic',     sublabel: 'validate · log · transform',          color: 'blue'   },
    { id: 'reflect', label: 'Reflect.set()',    sublabel: 'default mutation · correct receiver', color: 'green'  },
    { id: 'target',  label: 'Target Object',    sublabel: 'plain JS object mutated',             color: 'purple' },
  ],
  edges: [
    { from: 'code', to: 'trap' },
    { from: 'trap', to: 'logic' },
    { from: 'logic', to: 'reflect' },
    { from: 'reflect', to: 'target' },
  ],
  caption: 'every intercepted operation → custom logic → Reflect forwards to target with correct semantics',
};

const WEAKREF_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'strong',  label: 'Strong Reference',       sublabel: 'Map / variable / closure',      color: 'red'    },
    { id: 'weakref', label: 'WeakRef',                 sublabel: '.deref() → obj or undefined',   color: 'blue'   },
    { id: 'obj',     label: 'Large Object',            sublabel: 'DOM node · texture · widget',   color: 'teal'   },
    { id: 'gc',      label: 'GC Collects',             sublabel: 'when only WeakRefs remain',     color: 'orange' },
    { id: 'fin',     label: 'FinalizationRegistry',    sublabel: 'cleanup callback fires',        color: 'green'  },
  ],
  edges: [
    { from: 'strong',  to: 'obj' },
    { from: 'weakref', to: 'obj', dashed: true },
    { from: 'obj',     to: 'gc',  dashed: true },
    { from: 'gc',      to: 'fin' },
  ],
  caption: 'strong refs prevent GC · WeakRef allows it · FinalizationRegistry cleans up metadata after collection',
};

const TS_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'input',   label: 'Input Type T',      sublabel: 'any TypeScript type',              color: 'teal'   },
    { id: 'cond',    label: 'T extends X ?',      sublabel: 'conditional constraint check',     color: 'blue'   },
    { id: 'infer_r', label: 'infer R',            sublabel: 'extract sub-type at check site',   color: 'purple' },
    { id: 'yes',     label: 'True Branch',        sublabel: 'R or computed result type',        color: 'green'  },
    { id: 'no',      label: 'False Branch',       sublabel: 'never or fallback type',           color: 'red'    },
  ],
  edges: [
    { from: 'input', to: 'cond' },
    { from: 'cond',  to: 'infer_r', dashed: true },
    { from: 'infer_r', to: 'yes' },
    { from: 'cond',  to: 'no' },
  ],
  caption: 'T extends Promise<infer R> ? R : T — unwraps one Promise level · Awaited<T> is built this way',
};

const LONGTASK_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'user',   label: 'User Interaction',    sublabel: 'click · keydown · tap',                   color: 'teal'   },
    { id: 'busy',   label: 'Long Task >50ms',      sublabel: 'main thread blocked · events queue up',   color: 'red'    },
    { id: 'delay',  label: 'Input Delay',          sublabel: 'interaction waits · INP increases',       color: 'orange' },
    { id: 'yield',  label: 'scheduler.yield()',    sublabel: 'break task · browser processes input',    color: 'blue'   },
    { id: 'resume', label: 'Resume Work',          sublabel: 'high-priority continuation microtask',    color: 'green'  },
  ],
  edges: [
    { from: 'user',  to: 'busy' },
    { from: 'busy',  to: 'delay' },
    { from: 'busy',  to: 'yield', dashed: true },
    { from: 'yield', to: 'resume' },
  ],
  caption: 'break tasks >50ms with scheduler.yield() to keep INP < 200ms',
};

/* ═══════════════════════════════════════════════════════════════════
   REACT QUESTIONS
═══════════════════════════════════════════════════════════════════ */

const ACTIONS_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'user',   label: 'User Action',      sublabel: 'form submit / button click',           color: 'teal'   },
    { id: 'optim',  label: 'useOptimistic',     sublabel: 'instant UI update · pending state',   color: 'green'  },
    { id: 'action', label: 'Server Action',     sublabel: 'async mutation · runs in parallel',   color: 'blue'   },
    { id: 'ok',     label: 'Success',           sublabel: 'server confirms · optimistic settles',color: 'green'  },
    { id: 'err',    label: 'Error / Rollback',  sublabel: 'reverts to pre-optimistic state',     color: 'red'    },
  ],
  edges: [
    { from: 'user',   to: 'optim'  },
    { from: 'user',   to: 'action' },
    { from: 'action', to: 'ok'  },
    { from: 'action', to: 'err', dashed: true },
  ],
  caption: 'optimistic update fires immediately · server action runs in parallel · error auto-reverts',
};

const CONCURRENT_SPEC: DiagramSpec = {
  direction: 'TD',
  nodes: [
    { id: 'lanes',     label: 'Priority Lanes',    sublabel: 'Sync · Input · Transition · Idle',   color: 'teal'   },
    { id: 'sched',     label: 'React Scheduler',   sublabel: 'picks highest-priority lane',        color: 'blue'   },
    { id: 'fiber',     label: 'Fiber Work Loop',   sublabel: 'time-sliced · can pause mid-tree',   color: 'purple' },
    { id: 'commit',    label: 'Commit Phase',      sublabel: 'all-or-nothing DOM mutation',        color: 'green'  },
    { id: 'interrupt', label: 'Higher Priority',   sublabel: 'startTransition · deferred update',  color: 'orange' },
  ],
  edges: [
    { from: 'lanes',     to: 'sched'  },
    { from: 'sched',     to: 'fiber'  },
    { from: 'fiber',     to: 'commit' },
    { from: 'interrupt', to: 'sched', dashed: true },
  ],
  caption: 'Sync lane beats Transition lane · Fiber can be interrupted before commit phase',
};

const ERRBOUND_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'render',   label: 'Component Render',  sublabel: 'React render phase',                      color: 'teal'   },
    { id: 'err',      label: 'Error Thrown',       sublabel: 'during render · constructor · lifecycle', color: 'red'    },
    { id: 'eb',       label: 'Error Boundary',     sublabel: 'getDerivedStateFromError catches it',     color: 'orange' },
    { id: 'fallback', label: 'Fallback UI',        sublabel: 'degraded experience shown to user',       color: 'blue'   },
    { id: 'reset',    label: 'Reset',              sublabel: 'key change · resetErrorBoundary()',        color: 'green'  },
  ],
  edges: [
    { from: 'render',   to: 'err'      },
    { from: 'err',      to: 'eb'       },
    { from: 'eb',       to: 'fallback' },
    { from: 'fallback', to: 'reset', dashed: true },
  ],
  caption: 'does NOT catch: async errors · event handlers · SSR errors · errors inside the boundary itself',
};

const HOOK_SPEC: DiagramSpec = {
  direction: 'LR',
  nodes: [
    { id: 'comp',   label: 'Component',         sublabel: 'UI concerns · JSX only',            color: 'teal'   },
    { id: 'hook',   label: 'Custom Hook',        sublabel: 'use* · stateful · React APIs',      color: 'blue'   },
    { id: 'util',   label: 'Utility Function',   sublabel: 'pure · no React · independently testable', color: 'green' },
    { id: 'state',  label: 'State + Effects',    sublabel: 'useState · useEffect · useRef',     color: 'purple' },
    { id: 'test',   label: 'renderHook()',        sublabel: '@testing-library/react isolation',  color: 'orange' },
  ],
  edges: [
    { from: 'comp', to: 'hook' },
    { from: 'hook', to: 'state' },
    { from: 'comp', to: 'util', dashed: true },
    { from: 'hook', to: 'test', dashed: true },
  ],
  caption: 'extract to hook when stateful or uses React APIs · utility fn for pure computations',
};

const STREAMING_SPEC: DiagramSpec = {
  direction: 'TD',
  nodes: [
    { id: 'server', label: 'Server',             sublabel: 'renderToPipeableStream()',           color: 'blue'   },
    { id: 'shell',  label: 'HTML Shell',          sublabel: 'instant · Suspense fallbacks shown', color: 'teal'   },
    { id: 'c1',     label: 'Chunk: fast query',   sublabel: 'Suspense resolved · streamed',       color: 'green'  },
    { id: 'c2',     label: 'Chunk: slow query',   sublabel: 'slower data · streamed later',       color: 'orange' },
    { id: 'hydrate',label: 'Selective Hydration', sublabel: 'each chunk hydrated on arrival',     color: 'purple' },
  ],
  edges: [
    { from: 'server', to: 'shell'   },
    { from: 'server', to: 'c1',    dashed: true },
    { from: 'server', to: 'c2',    dashed: true },
    { from: 'shell',  to: 'hydrate' },
    { from: 'c1',     to: 'hydrate' },
    { from: 'c2',     to: 'hydrate' },
  ],
  caption: 'shell delivers instantly · chunks stream as data resolves · hydration is interruptible',
};

/* ═══════════════════════════════════════════════════════════════════
   QUESTION BUILDER
═══════════════════════════════════════════════════════════════════ */

function buildQuestions(svgs: Record<string, string>) {
  return [
    /* ─── JS 1: Generators ─────────────────────────────────────── */
    {
      id: 'custom-js-generators-how-do-generators-work-practical-problems-they-solve',
      topic: 'JavaScript', subtopic: 'Generators & Custom Iterators',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How do JavaScript generators work, and what practical problems do they solve that regular functions or promises cannot?',
      expectedPoints: [
        'function* declaration returns an iterator object when called — execution starts only on the first .next() call, not at call time',
        'yield pauses execution and returns {value, done:false}; the generator resumes from that exact point on the next .next() call',
        'Two-way data channel: .next(value) sends a value back into the generator as the result of the yield expression — enables coroutine-like patterns',
        'yield* delegates iteration to another iterable; generators compose naturally without building intermediate arrays',
        'Lazy evaluation enables infinite sequences: values are produced on demand, keeping memory at O(1) per step',
        'Async generators (async function*) combined with for await...of handle streaming data — paginated APIs, chunked file reads, SSE',
      ],
      followUps: [
        'How does redux-saga use generators to describe side-effect flows, and why is each saga step easier to test than a Promise chain?',
        'What happens if you call .return() or .throw() on a generator?',
        'How do you implement a cancellable async operation using an async generator?',
      ],
      tags: ['generators', 'iterators', 'lazy-evaluation', 'coroutines', 'async-generators'],
      childExplanation: "Generators are like a pause-button machine. A normal function runs from start to finish without stopping. A generator runs a bit, pauses and hands you a value — then waits. You press 'go' again and it continues exactly where it left off. You can also pass a message back in when you press 'go', which the generator receives.",
      detailedExplanation: `<h4>How Generators Work</h4>
<p>Calling a <code>function*</code> returns an <strong>iterator</strong> — execution doesn't start until <code>.next()</code> is called. Each call resumes until the next <code>yield</code>, returning <code>{ value, done: false }</code>. A <code>return</code> produces <code>{ value, done: true }</code>.</p>
<pre><code>function* range(start, end) {
  for (let i = start; i &lt; end; i++) yield i;
}
// Lazy: no array created — each value computed on demand
for (const n of range(0, 1_000_000)) { /* process n */ }</code></pre>

<h4>Two-Way Communication</h4>
<p>The value passed to <code>.next(value)</code> becomes the result of the <em>previous</em> <code>yield</code> expression inside the generator. This enables coroutine-style state machines where the caller and generator exchange data on each turn — the foundation of <strong>redux-saga</strong>.</p>

<h4>Async Generators for Streaming</h4>
<p>Combining <code>async function*</code> with <code>for await...of</code> is the idiomatic way to consume paginated APIs or chunked streams without buffering everything:</p>
<pre><code>async function* paginate(url) {
  let cursor = null;
  do {
    const res = await fetch(url + (cursor ? '?cursor=' + cursor : ''));
    const { data, next } = await res.json();
    yield* data;
    cursor = next;
  } while (cursor);
}</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>A generator is exhausted after done:true — calling .next() again always returns {value:undefined, done:true}. To iterate again, call the function* again to get a fresh iterator.</p></div>
<blockquote>Senior Insight: If you find yourself building large intermediate arrays to process data (map → filter → reduce), a generator pipeline keeps memory at O(1) per item. For producer/consumer patterns where one side runs faster, generators are cleaner than Promises or callbacks.</blockquote>`,
      diagramSvg: svgs.gen,
      quiz: {
        format: 'mcq',
        question: 'What value does gen.next("hello") inject into a paused generator?',
        options: [
          '"hello" becomes the value yielded to the previous .next() caller',
          '"hello" is ignored; generators cannot receive input',
          '"hello" becomes the result of the yield expression where the generator is paused',
          '"hello" is appended to the generator\'s internal queue',
        ],
        answer: 2,
        explanation: 'The value passed to .next(value) becomes the result of the yield expression that caused the generator to pause — enabling two-way communication between caller and generator.',
      },
    },

    /* ─── JS 2: Proxy & Reflect ─────────────────────────────────── */
    {
      id: 'custom-js-proxy-reflect-api-how-does-proxy-work-with-reflect-real-world-uses',
      topic: 'JavaScript', subtopic: 'Proxy & Reflect API',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'What is the JavaScript Proxy API, how does it work alongside Reflect, and what real-world problems does it solve?',
      expectedPoints: [
        'new Proxy(target, handler) wraps any object and intercepts fundamental operations via traps: get, set, has, deleteProperty, apply, construct',
        'Reflect mirrors the Proxy trap API exactly — Reflect.get/set/has provide default behaviour, ensuring traps can fall through correctly',
        'Calling Reflect.set(target, key, value, receiver) inside a set trap is required to preserve prototype chain receiver semantics and return the correct boolean',
        'Vue 3\'s reactivity system replaced Object.defineProperty with Proxy — enables tracking array mutations, new property additions, and deletions without special array methods',
        'Common use cases: runtime validation, logging/debugging, immutable record patterns, memoization/lazy initialisation, capability-based security with Proxy.revocable()',
        'Private class fields (#field) bypass proxies — accessing them through a proxy throws TypeError because the check is against the actual instance, not the proxy',
      ],
      followUps: [
        'How does Vue 3 use the get trap to track reactive dependencies inside a computed() effect?',
        'Why can\'t you proxy primitive values, and how do wrappers like MobX handle this?',
        'What is Proxy.revocable() and when would you use it?',
      ],
      tags: ['proxy', 'reflect', 'metaprogramming', 'reactivity', 'vue3'],
      childExplanation: "Proxy is like a receptionist who intercepts all calls to your boss. Instead of reaching your boss directly, every call goes through the receptionist — who can log it, filter it, or change the message — then forwards it along. Reflect is the part that says 'and now do what would have happened normally'.",
      detailedExplanation: `<h4>Creating a Proxy</h4>
<p>A Proxy intercepts every fundamental operation on an object. If a trap is missing from the handler, the operation passes through to the target unchanged:</p>
<pre><code>const validator = new Proxy({}, {
  set(target, key, value, receiver) {
    if (key === 'age' &amp;&amp; typeof value !== 'number')
      throw new TypeError('age must be a number');
    return Reflect.set(target, key, value, receiver);
  },
});
validator.age = 'twenty'; // throws
validator.age = 30;       // ok</code></pre>

<h4>Why Reflect Is Essential</h4>
<p>Every Proxy trap has a matching <code>Reflect</code> method with an identical signature. Using <code>Reflect.set(target, key, value, receiver)</code> instead of <code>target[key] = value</code>: (1) ensures the mutation actually happens, (2) forwards the correct <em>receiver</em> so inherited prototype setters work, (3) returns the proper boolean for strict-mode callers.</p>

<h4>Real-World: Vue 3 Reactivity</h4>
<p>Vue 3 wraps component state in a Proxy. The <code>get</code> trap checks which effect is currently running (stored in a module-level variable) and registers a dependency. The <code>set</code> trap schedules re-runs of those effects — automatic fine-grained reactivity with no special array methods or deep-clone scanning.</p>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Private class fields (#field) are checked against the actual instance, not the proxy. Any code that reads a private field through a proxy throws a TypeError. This is a known limitation that affects libraries trying to wrap class instances — they must either use public fields or explicitly bind methods on the proxy.</p></div>
<blockquote>Senior Insight: Understanding Proxy deeply lets you read the internals of Vue 3, MobX 6, Immer, and Solid.js signals — they all rely on Proxy traps. Knowing why Reflect is required (receiver forwarding) separates candidates who understand metaprogramming from those who just memorised the API.</blockquote>`,
      diagramSvg: svgs.proxy,
      quiz: {
        format: 'mcq',
        question: 'Why should a Proxy set trap use Reflect.set() rather than target[key] = value?',
        options: [
          'Reflect.set() is faster than direct assignment',
          'Reflect.set() correctly handles prototype chain receivers and returns the proper boolean for strict-mode setters',
          'Direct assignment inside a trap causes an infinite loop',
          'Reflect.set() triggers Vue\'s reactivity system automatically',
        ],
        answer: 1,
        explanation: 'Reflect.set(target, key, value, receiver) preserves the receiver for inherited setters and returns the boolean that strict-mode code expects. Without it, setter inheritance breaks silently.',
      },
    },

    /* ─── JS 3: WeakRef ─────────────────────────────────────────── */
    {
      id: 'custom-js-weakref-finalization-registry-memory-sensitive-caching',
      topic: 'JavaScript', subtopic: 'WeakRef & FinalizationRegistry',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'When would you use WeakRef and FinalizationRegistry for memory-sensitive caching, and how do they differ from WeakMap?',
      expectedPoints: [
        'WeakRef holds an object without preventing GC; .deref() returns the live object or undefined if it was collected',
        'FinalizationRegistry.register(target, heldValue) fires a cleanup callback with heldValue after target is collected — useful for removing stale cache keys',
        'WeakMap keys are weakly held, but the values are strongly referenced; iterating all entries is impossible by design',
        'WeakRef is independent: the WeakRef itself is strongly held, but the referent can be collected — enabling standalone optional references outside a Map',
        'Use case: DOM widget cache keyed by container node — when the node is removed, the cache entry self-evicts via FinalizationRegistry',
        'GC timing is non-deterministic — code must always handle .deref() returning undefined; never use FinalizationRegistry for correctness-critical cleanup',
      ],
      followUps: [
        'Why is relying on FinalizationRegistry callbacks for resource management (e.g. closing file handles) dangerous?',
        'When is WeakMap sufficient and WeakRef unnecessary?',
        'How does Node.js handle WeakRef across garbage collection cycles?',
      ],
      tags: ['weakref', 'finalization-registry', 'memory-management', 'garbage-collection', 'weakmap'],
      childExplanation: "Imagine sticky notes on things in your house. A strong note means the cleaning crew can never remove that item. A WeakRef note says 'I know where this is, but if the cleaning crew needs the space, they can take it.' FinalizationRegistry is like a notification buzzer — it tells you after the crew removes something so you can update your notebook.",
      detailedExplanation: `<h4>WeakRef Pattern</h4>
<p>A WeakRef holds a reference without preventing GC. Always guard against collection:</p>
<pre><code>const cache = new Map();
const registry = new FinalizationRegistry((key) => cache.delete(key));

function getWidget(domNode) {
  let widget = cache.get(domNode)?.deref();
  if (!widget) {
    widget = createExpensiveWidget(domNode);
    cache.set(domNode, new WeakRef(widget));
    registry.register(widget, domNode); // clean up cache entry after GC
  }
  return widget;
}</code></pre>

<h4>WeakRef vs WeakMap</h4>
<p>Use <strong>WeakMap</strong> when you want a side-table keyed by objects (keys are weakly held, values are strongly held and collected when the key disappears). Use <strong>WeakRef</strong> when the <em>value itself</em> is optionally collectible, or when you need a standalone weak reference outside any collection.</p>

<h4>FinalizationRegistry Limitations</h4>
<p>The GC may batch callbacks, delay them, or (in short-lived scripts) never call them. FinalizationRegistry is appropriate for optional memory housekeeping only — never for releasing network connections, file handles, or locks that must be freed promptly.</p>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Storing a WeakRef inside the same closure that created the referent keeps a strong path alive anyway (closure → WeakRef, but also closure → local variable → object). Make sure you only store the WeakRef, not the original reference, once you want GC to be possible.</p></div>
<blockquote>Senior Insight: The practical sweet spot for WeakRef is large-object caches: WebGL textures, decoded image bitmaps, compiled WASM modules. For most application caches, a simple LRU with a size limit is simpler and more predictable. Reach for WeakRef only when "evict under memory pressure" is explicitly required.</blockquote>`,
      diagramSvg: svgs.weakref,
      quiz: {
        format: 'mcq',
        question: 'What does WeakRef.prototype.deref() return after the referenced object is garbage collected?',
        options: ['null', 'undefined', 'The last known snapshot of the object', 'A ReferenceError is thrown'],
        answer: 1,
        explanation: '.deref() returns undefined (not null) when the object has been collected. Always guard: const obj = ref.deref(); if (!obj) return;',
      },
    },

    /* ─── JS 4: TypeScript Advanced Types ───────────────────────── */
    {
      id: 'custom-js-typescript-conditional-types-infer-mapped-template-literals',
      topic: 'JavaScript', subtopic: 'Advanced TypeScript: conditional types & infer',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'Explain TypeScript conditional types, the infer keyword, and template literal types — with real examples of when each is necessary.',
      expectedPoints: [
        'T extends U ? X : Y evaluates at compile time; when T is a union TypeScript distributes over each member automatically (distributive conditional types)',
        'infer R inside a condition lets TypeScript capture a sub-type: type Awaited<T> = T extends Promise<infer R> ? R : T unwraps one Promise level',
        'Prevent distribution by wrapping both sides in tuples: [T] extends [U] — required for IsNever<never> to return true instead of never',
        'Template literal types compose string literals: type EventKey = `on${Capitalize<string>}` creates onFoo, onBar patterns for typed event maps',
        'Mapped types with as allow key remapping: { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] } generates getter signatures',
        'Standard utility types built on conditional types: ReturnType<F>, Parameters<F>, InstanceType<C>, Extract<T,U>, Exclude<T,U>',
      ],
      followUps: [
        'How do you extract the element type from an array type using infer?',
        'What is the difference between Exclude<T,U> and Omit<T,K>?',
        'How do you build a DeepReadonly<T> type that recurses through nested objects?',
      ],
      tags: ['typescript', 'conditional-types', 'infer', 'template-literals', 'mapped-types'],
      childExplanation: "TypeScript conditional types are if-statements for types. You say: 'if this type looks like this shape, the result is TypeA, otherwise TypeB.' The infer keyword is like telling TypeScript: 'when checking the shape, please remember the inner part with this name so I can use it in my answer.'",
      detailedExplanation: `<h4>Conditional Types</h4>
<p>The condition is checked at compile time. On a union, TypeScript distributes automatically:</p>
<pre><code>// NonNullable distributes over the union
type NonNullable&lt;T&gt; = T extends null | undefined ? never : T;
// NonNullable&lt;string | null | undefined&gt; = string</code></pre>

<h4>The infer Keyword</h4>
<p><code>infer R</code> captures a sub-type from within the constraint for use in the true branch:</p>
<pre><code>type UnwrapPromise&lt;T&gt; = T extends Promise&lt;infer R&gt; ? R : T;
type UnwrapArray&lt;T&gt;   = T extends Array&lt;infer Item&gt; ? Item : T;
// UnwrapArray&lt;string[]&gt; = string · UnwrapArray&lt;number&gt; = number</code></pre>

<h4>Template Literal Types</h4>
<p>Combine string literal unions into constrained string patterns — invaluable for typed event systems:</p>
<pre><code>type Side = 'top' | 'right' | 'bottom' | 'left';
type Padding = \`padding-\${Side}\`;
// 'padding-top' | 'padding-right' | 'padding-bottom' | 'padding-left'

// Typed event emitter — handler signature inferred from map
type EventMap = { userCreated: User; orderPlaced: Order };
function on&lt;K extends keyof EventMap&gt;(event: K, handler: (e: EventMap[K]) =&gt; void): void;</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>IsNever&lt;T&gt; = T extends never ? true : false returns never when T = never because distribution over an empty union produces nothing. Fix: type IsNever&lt;T&gt; = [T] extends [never] ? true : false — the tuple prevents distribution.</p></div>
<blockquote>Senior Insight: The highest-value application is building type-safe event emitters and plugin systems where handler types are inferred automatically from a central event map. This eliminates an entire class of runtime bugs with zero runtime overhead.</blockquote>`,
      diagramSvg: svgs.ts,
      quiz: {
        format: 'mcq',
        question: 'What does type R = string | null extends null ? never : string | null evaluate to with distributive conditional types?',
        options: ['never', 'string', 'string | null', 'null'],
        answer: 1,
        explanation: 'Distribution: string extends null → string; null extends null → never. Union of string | never = string. Distributive conditional types filter each union member independently.',
      },
    },

    /* ─── JS 5: Long Tasks ───────────────────────────────────────── */
    {
      id: 'custom-js-long-tasks-profiling-identify-break-up-tasks-blocking-main-thread',
      topic: 'JavaScript', subtopic: 'Long Tasks & Main Thread Profiling',
      difficulty: 'senior', type: 'debugging', sourceFile: 'custom',
      question: 'How do you identify and break up long JavaScript tasks (>50ms) that degrade INP, and what browser APIs measure them in production?',
      expectedPoints: [
        'Any main-thread task >50ms creates an input delay window — the browser cannot process clicks or keystrokes until the task finishes',
        'PerformanceObserver with type: "longtask" fires after each long task with duration and attribution pointing to the responsible script',
        'scheduler.yield() (Chrome 115+) returns a Promise that yields to the browser then re-queues continuation at high priority — better than setTimeout(0)',
        'Fallback pattern: batch work with setTimeout(0) or requestIdleCallback for non-urgent tasks',
        'Web Workers should handle truly CPU-bound work (parsing, compression, ML inference) — the main thread never blocks regardless of computation time',
        'Chrome DevTools Performance panel shows long tasks as red-capped bars; the "Bottom-Up" tab shows which functions consumed the most main-thread time',
      ],
      followUps: [
        'What is the difference between scheduler.yield() and setTimeout(0) regarding task priority?',
        'How do you safely break a for-loop over 100,000 items without corrupting intermediate state?',
        'How does React\'s concurrent renderer internally use similar yielding to keep the browser responsive?',
      ],
      tags: ['long-tasks', 'performance-observer', 'scheduler', 'inp', 'web-workers', 'profiling'],
      childExplanation: "The main thread is like a single checkout cashier. If someone asks the cashier to count every item in the stockroom (a 'long task'), other customers have to wait — even for quick transactions. Breaking up tasks is like telling the cashier: 'count 50 items, then quickly serve waiting customers, then count 50 more.'",
      detailedExplanation: `<h4>Detecting Long Tasks in Production</h4>
<pre><code>new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    analytics.send('longtask', {
      duration: Math.round(entry.duration),
      source: entry.attribution?.[0]?.name,
    });
  }
}).observe({ type: 'longtask', buffered: true });</code></pre>

<h4>Breaking Up Work with scheduler.yield()</h4>
<p><code>scheduler.yield()</code> yields control back to the browser, processes any pending input events, then resumes work at a higher priority than <code>setTimeout(0)</code> (which can be clamped to 4ms+ and has lower task priority):</p>
<pre><code>async function processLargeList(items) {
  const CHUNK = 100;
  for (let i = 0; i &lt; items.length; i++) {
    processItem(items[i]);
    if (i % CHUNK === 0 &amp;&amp; i &gt; 0) {
      await scheduler.yield(); // let browser breathe every 100 items
    }
  }
}</code></pre>

<h4>When to Use Web Workers</h4>
<p>If the computation never touches the DOM (CSV parsing, image resizing, crypto), move it to a Worker entirely. The main thread stays free regardless of computation time. Use the <strong>Comlink</strong> library for a cleaner async proxy API over <code>postMessage</code>.</p>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Nested setTimeout(0) calls are clamped to ~4ms in browsers, and they have lower priority than user input. For task-breaking that must resume with high priority after yielding, scheduler.yield() is the correct tool. Feature-detect it: if ('scheduler' in window &amp;&amp; 'yield' in scheduler).</p></div>
<blockquote>Senior Insight: Most SPA long-task problems come from two sources: (1) oversized JS bundles blocking during parse/evaluation — fix with code-splitting; (2) synchronous data transforms in event handlers — fix with task-breaking or Workers. Profile first with the Performance panel before guessing which applies.</blockquote>`,
      diagramSvg: svgs.longtask,
      quiz: {
        format: 'mcq',
        question: 'Which PerformanceObserver entry type fires after a main-thread task exceeds 50ms?',
        options: ['"resource"', '"measure"', '"longtask"', '"event"'],
        answer: 2,
        explanation: 'PerformanceObserver with type: "longtask" reports any main-thread task longer than 50ms, including duration and script attribution information.',
      },
    },

    /* ─── React 1: React 19 Actions & useOptimistic ─────────────── */
    {
      id: 'custom-react-19-actions-useoptimistic-simplify-async-mutations',
      topic: 'React', subtopic: 'React 19: Actions & useOptimistic',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How do React 19 Actions and useOptimistic simplify async mutations compared to the previous useState + useTransition + manual loading-state pattern?',
      expectedPoints: [
        'An async function passed as a form action is automatically wrapped in a transition — no manual startTransition needed, pending state is tracked by useFormStatus',
        'useOptimistic(state, updateFn) returns [optimisticState, addOptimistic] — addOptimistic immediately applies updateFn to produce a temporary state shown during the async operation',
        'On success, optimistic state is replaced by the real server state; on error it reverts to the previous state automatically — no manual rollback code',
        'useFormStatus() provides {pending, data, method, action} to any child component inside the form, eliminating prop drilling of loading state',
        'useActionState(action, initialState) wraps an action and exposes [state, formAction, isPending] — the single hook for controlled async form patterns',
        'Previous pattern required: useState for data, useState for loading, useState for error, useEffect for cleanup, try/catch/finally — Actions collapse this to 1-2 hooks',
      ],
      followUps: [
        'How does React\'s automatic batching interact with useOptimistic state updates?',
        'Can Server Actions be used outside of forms — for example, in a button onClick handler?',
        'How do you handle optimistic updates for list items where the server returns a new ID?',
      ],
      tags: ['react-19', 'server-actions', 'useoptimistic', 'useformstatus', 'mutations'],
      childExplanation: "Imagine ordering food at a restaurant. Old React was like the waiter making you wait at the counter until the kitchen confirms your order before showing anything. React 19 Actions are like the waiter immediately writing 'ORDER PLACED' on the receipt (optimistic), going to the kitchen, and only erasing it if the kitchen says they're out of stock (rollback).",
      detailedExplanation: `<h4>Before React 19 (the boilerplate)</h4>
<pre><code>const [items, setItems] = useState(initialItems);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function handleAdd(newItem) {
  setLoading(true);
  try {
    const saved = await api.add(newItem);
    setItems(prev =&gt; [...prev, saved]);
  } catch (e) { setError(e.message); }
  finally { setLoading(false); }
}</code></pre>

<h4>With React 19 Actions + useOptimistic</h4>
<pre><code>const [items, setItems] = useState(initialItems);
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, newItem) =&gt; [...state, { ...newItem, pending: true }]
);

async function formAction(formData) {
  const newItem = { text: formData.get('text') };
  addOptimistic(newItem);                // instant UI update
  const saved = await api.add(newItem);  // server round-trip
  setItems(prev =&gt; [...prev, saved]);    // commit real state
}

return (
  &lt;form action={formAction}&gt;
    &lt;input name="text" /&gt;
    &lt;SubmitButton /&gt; {/* useFormStatus().pending inside */}
    {optimisticItems.map(item =&gt; &lt;Item key={item.id} {...item} /&gt;)}
  &lt;/form&gt;
);</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>useOptimistic only works inside a transition (which React 19 form actions create automatically). Calling addOptimistic outside a transition or in a plain event handler will throw. If you need optimistic updates outside a form, wrap the call in startTransition().</p></div>
<blockquote>Senior Insight: The real win of React 19 Actions is the elimination of error/loading state synchronisation bugs — previously a common source of subtle UI inconsistencies. The automatic rollback on error means you never accidentally show stale optimistic data when a mutation fails.</blockquote>`,
      diagramSvg: svgs.actions,
      quiz: {
        format: 'mcq',
        question: 'What happens to useOptimistic state when the Server Action throws an error?',
        options: [
          'The optimistic state remains and must be manually reverted',
          'React throws an unhandled error that must be caught by an Error Boundary',
          'The optimistic state automatically reverts to the value before addOptimistic was called',
          'The form is reset and all state is cleared',
        ],
        answer: 2,
        explanation: 'useOptimistic automatically reverts to the "canonical" state when the async operation that triggered it completes — whether by success or error. On error, the UI snaps back to the pre-optimistic state.',
      },
    },

    /* ─── React 2: Concurrent Rendering ─────────────────────────── */
    {
      id: 'custom-react-concurrent-rendering-fiber-scheduler-priority-lanes',
      topic: 'React', subtopic: 'Concurrent Rendering & React Scheduler',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'How does React\'s concurrent renderer use Fiber and priority lanes to interrupt and resume work without committing a partial UI?',
      expectedPoints: [
        'Fiber is a linked list of work units (one per component); React processes one fiber at a time and can pause the loop between units',
        'Priority lanes assign urgency to updates: SyncLane (user input) > InputContinuousLane > DefaultLane > TransitionLane > IdleLane',
        'startTransition marks an update as non-urgent (TransitionLane) — React renders it in the background and can interrupt it when higher-priority work arrives',
        'The Scheduler uses MessageChannel to schedule work between browser frames, yielding the thread before each frame deadline',
        'The commit phase is always synchronous and uninterruptible — partial DOM mutations are never visible to the user',
        'useDeferredValue wraps a prop to opt-out of urgent re-renders, keeping the previous value visible while the deferred render happens in background',
      ],
      followUps: [
        'Why can\'t React interrupt a render mid-fiber (mid-component), and what constraint does this place on component render functions?',
        'What is Suspense\'s role in concurrent rendering, and how does it interact with transitions?',
        'How do you use the React DevTools Profiler to identify components causing transition lag?',
      ],
      tags: ['concurrent-rendering', 'fiber', 'scheduler', 'priority-lanes', 'start-transition'],
      childExplanation: "React's concurrent renderer is like a chef who can pause cooking a side dish when the main course needs urgent attention. The key rule: once the chef starts plating (committing), they can't pause — a half-plated dish would look wrong. But during prep (rendering), they can stop and prioritise.",
      detailedExplanation: `<h4>Fiber Architecture</h4>
<p>Each component corresponds to a <strong>Fiber node</strong> — a plain JavaScript object in a linked list. React's work loop processes one fiber, checks if there's higher-priority work pending, and either continues or pauses. This is possible because render functions must be <em>pure</em> (same inputs → same output) — React can discard and restart a partial render without side effects.</p>

<h4>Priority Lanes</h4>
<p>Every update is assigned a lane (a bitmask). The scheduler always processes the highest-priority pending lane first:</p>
<ul>
  <li><strong>SyncLane</strong> — discrete user events (click, keydown); rendered synchronously</li>
  <li><strong>InputContinuousLane</strong> — continuous events (scroll, drag)</li>
  <li><strong>DefaultLane</strong> — most setState calls outside transitions</li>
  <li><strong>TransitionLane</strong> — updates wrapped in startTransition; interruptible</li>
  <li><strong>IdleLane</strong> — background prefetching; lowest priority</li>
</ul>

<h4>Practical Usage</h4>
<pre><code>const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

function handleInput(e) {
  setQuery(e.target.value);                    // SyncLane — input updates instantly
  startTransition(() =&gt; {
    setResults(heavyFilter(e.target.value));   // TransitionLane — interruptible
  });
}</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Component render functions must be pure for concurrent rendering to work correctly. Side effects inside the render function (modifying external variables, direct DOM access) can produce inconsistent results if React re-runs or discards renders. All side effects belong in useEffect.</p></div>
<blockquote>Senior Insight: The biggest real-world win of concurrent rendering is large filtered/sorted lists. Without transitions, every keystroke triggers a synchronous render of thousands of rows. With startTransition, React shows the previous results while rendering the new filter in the background — zero janky frames.</blockquote>`,
      diagramSvg: svgs.concurrent,
      quiz: {
        format: 'mcq',
        question: 'What makes a React state update "interruptible" in concurrent mode?',
        options: [
          'Using useState instead of useReducer',
          'Wrapping it in startTransition or useTransition',
          'Calling it inside a useEffect',
          'Marking the component with React.memo',
        ],
        answer: 1,
        explanation: 'startTransition marks the enclosed state updates as non-urgent (TransitionLane). React will render them in the background and interrupt them if higher-priority work (like user input) arrives before the render completes.',
      },
    },

    /* ─── React 3: Error Boundaries ─────────────────────────────── */
    {
      id: 'custom-react-error-boundaries-recovery-patterns-what-errors-not-caught',
      topic: 'React', subtopic: 'Error Boundaries & Recovery Patterns',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'What are React error boundaries, which error types do they NOT catch, and how do you implement a retry/reset mechanism?',
      expectedPoints: [
        'Error boundaries are class components implementing getDerivedStateFromError (update state → show fallback) and componentDidCatch (log error)',
        'They catch errors during: render, lifecycle methods (componentDidMount/Update), and constructors of child components',
        'NOT caught: async errors (setTimeout, fetch .catch), event handler errors, server-side rendering errors, errors thrown inside the error boundary itself',
        'For async errors thrown outside render, wrap in try/catch and call setState to propagate to the boundary, or use a library like react-error-boundary',
        'Reset strategy 1: pass a key prop to the boundary — changing key unmounts and remounts the entire subtree, resetting all state',
        'Reset strategy 2: react-error-boundary\'s resetErrorBoundary() callback lets you call reset programmatically with clean-up logic',
      ],
      followUps: [
        'How do you catch errors in event handlers and display them via an error boundary?',
        'What is the react-error-boundary library and what does it add over building your own class component?',
        'How do you log errors to Sentry from componentDidCatch without leaking user data?',
      ],
      tags: ['error-boundaries', 'error-handling', 'react', 'recovery', 'react-error-boundary'],
      childExplanation: "Error boundaries are like the walls in a house. If a fire starts in the kitchen, fireproof walls keep it from spreading to the living room. The kitchen shows a 'temporarily closed' sign (fallback UI) while repairs happen, but the rest of the house works fine.",
      detailedExplanation: `<h4>Implementing an Error Boundary</h4>
<pre><code>class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error }; // triggers fallback render
  }

  componentDidCatch(error, info) {
    logErrorToSentry(error, info.componentStack); // side effects here only
  }

  render() {
    if (this.state.hasError) {
      return &lt;this.props.fallback onReset={() =&gt; this.setState({ hasError: false })} /&gt;;
    }
    return this.props.children;
  }
}</code></pre>

<h4>What Error Boundaries Do NOT Catch</h4>
<ul>
  <li><strong>Async errors</strong> — errors in setTimeout, Promises, fetch .catch() — React has already exited the render call stack</li>
  <li><strong>Event handlers</strong> — onClick, onChange errors must be caught with try/catch inside the handler</li>
  <li><strong>SSR errors</strong> — server rendering uses a different code path</li>
  <li><strong>Errors in the boundary itself</strong> — they bubble to the nearest parent boundary</li>
</ul>

<h4>Reset With a Key</h4>
<p>The simplest retry mechanism: store an integer in state, increment it on reset, and pass it as the <code>key</code> to the boundary. React unmounts and remounts the entire subtree, giving it a fresh start.</p>
<pre><code>const [key, setKey] = useState(0);
&lt;ErrorBoundary key={key} fallback={&lt;RetryButton onClick={() =&gt; setKey(k =&gt; k + 1)} /&gt;}&gt;
  &lt;SomeComponent /&gt;
&lt;/ErrorBoundary&gt;</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Errors thrown inside useEffect are NOT caught by error boundaries — effects run after the render is committed and outside the synchronous render path. To surface async errors into a boundary, call a state setter from within a catch block, which triggers a synchronous render that the boundary can intercept.</p></div>
<blockquote>Senior Insight: Place error boundaries strategically — one global boundary at the app root for catastrophic failures, plus local boundaries around each independently-recoverable feature (chart widget, comments section). Too fine-grained and users see lots of small broken pieces; too coarse and a minor widget crashes the whole app.</blockquote>`,
      diagramSvg: svgs.errbound,
      quiz: {
        format: 'mcq',
        question: 'Which type of error does a React Error Boundary NOT catch?',
        options: [
          'Errors thrown in a child component\'s constructor',
          'Errors thrown during the render method of a child component',
          'Errors thrown in an async event handler (setTimeout / fetch)',
          'Errors thrown in componentDidMount of a child component',
        ],
        answer: 2,
        explanation: 'Async errors (setTimeout, Promise rejections, fetch) happen outside the React render call stack after the component tree has already committed. Error boundaries only catch synchronous errors during the render / lifecycle phases.',
      },
    },

    /* ─── React 4: Custom Hook Design ───────────────────────────── */
    {
      id: 'custom-react-custom-hook-design-principles-when-extract-vs-utility-function',
      topic: 'React', subtopic: 'Custom Hook Design Principles',
      difficulty: 'senior', type: 'conceptual', sourceFile: 'custom',
      question: 'What principles guide the design of custom React hooks, and when should you extract logic into a hook versus a plain utility function?',
      expectedPoints: [
        'Extract to a hook when the logic uses React primitives (useState, useEffect, useRef, useContext) — these cannot live in a plain function',
        'Plain utility functions are better for pure computations (date formatting, validation) — they are simpler, fully tree-shakeable, and testable without React',
        'A custom hook should represent one cohesive concern (useLocalStorage, useDebounce, useIntersectionObserver) — not a grab-bag of unrelated state',
        'Return an array [value, setter] for swap-friendly APIs; return an object {value, onChange} when the hook has many outputs and naming matters',
        'Never conditionally call a hook — the rules of hooks require stable call order; conditional logic must live inside the hook body',
        'Test hooks with renderHook() from @testing-library/react — it provides a minimal React component wrapper for isolated hook testing',
      ],
      followUps: [
        'How do you compose multiple custom hooks without creating a "hook of hooks" anti-pattern?',
        'When should a hook accept a ref vs a value as a parameter?',
        'How do you handle cleanup properly in a custom hook that sets up subscriptions?',
      ],
      tags: ['custom-hooks', 'react-patterns', 'hook-design', 'testing-hooks', 'separation-of-concerns'],
      childExplanation: "Custom hooks are like power strips — they let you plug multiple devices (components) into the same electrical logic without running separate wires to each one. Utility functions are like calculators — purely math, no power needed.",
      detailedExplanation: `<h4>The Extraction Rule</h4>
<p>Ask two questions: (1) Does the logic need React state or side effects? If yes → hook. (2) Is the logic reused in 3+ places? If yes → extract regardless. If both answers are no, keep it inline.</p>

<h4>Well-Designed Hook Example</h4>
<pre><code>function useLocalStorage&lt;T&gt;(key: string, initialValue: T) {
  const [stored, setStored] = useState&lt;T&gt;(() =&gt; {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? initialValue; }
    catch { return initialValue; }
  });

  const setValue = useCallback((value: T) =&gt; {
    setStored(value);
    localStorage.setItem(key, JSON.stringify(value));
  }, [key]);

  return [stored, setValue] as const;
}
// Usage: const [theme, setTheme] = useLocalStorage('theme', 'light');</code></pre>

<h4>Return Shape Convention</h4>
<ul>
  <li><strong>Tuple [value, setter]</strong> — mirrors useState; easy to rename at call site</li>
  <li><strong>Object {data, loading, error}</strong> — better for hooks with many outputs (useQuery pattern)</li>
  <li><strong>Single value</strong> — for read-only derived values (useMediaQuery, useScrollPosition)</li>
</ul>

<h4>Testing Hooks in Isolation</h4>
<pre><code>import { renderHook, act } from '@testing-library/react';
test('persists value to localStorage', () =&gt; {
  const { result } = renderHook(() =&gt; useLocalStorage('key', 'default'));
  act(() =&gt; result.current[1]('updated'));
  expect(localStorage.getItem('key')).toBe('"updated"');
});</code></pre>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>A hook that accepts raw values and uses them in useEffect dependency arrays must be careful with object/array references. Every render creates a new object, so {options} in the dependency array causes infinite loops. Accept primitive values or memoized refs, or use a deep-comparison hook like use-deep-compare-effect.</p></div>
<blockquote>Senior Insight: The best custom hooks are "invisible" — they do exactly one thing, have minimal API surface, and are easy to test without a DOM. If you can't explain what a hook does in one sentence, it's probably doing too much and should be split.</blockquote>`,
      diagramSvg: svgs.hook,
      quiz: {
        format: 'mcq',
        question: 'What is the primary reason to extract logic into a custom hook instead of a utility function?',
        options: [
          'Custom hooks have better performance than utility functions',
          'The logic requires useState, useEffect, or other React primitives',
          'Custom hooks are automatically memoized by React',
          'Utility functions cannot be shared across components',
        ],
        answer: 1,
        explanation: 'Custom hooks exist specifically to share stateful logic and React lifecycle integration (useState, useEffect, useRef, useContext). Pure computational logic without React APIs belongs in a plain utility function.',
      },
    },

    /* ─── React 5: Streaming SSR ─────────────────────────────────── */
    {
      id: 'custom-react-suspense-streaming-ssr-how-does-streaming-ssr-progressively-deliver',
      topic: 'React', subtopic: 'Suspense & Streaming SSR',
      difficulty: 'senior', type: 'system_design', sourceFile: 'custom',
      question: 'How does React\'s streaming SSR with Suspense boundaries progressively deliver HTML and selectively hydrate, and what trade-offs does it introduce?',
      expectedPoints: [
        'renderToPipeableStream (Node) / renderToReadableStream (edge) streams HTML — the browser receives and renders content before the server finishes rendering',
        'The initial "shell" contains everything outside Suspense boundaries; suspended boundaries are replaced with placeholder HTML and a <template> for the streamed chunk',
        'As each Suspense boundary\'s data resolves on the server, the corresponding HTML chunk is pushed into the stream with an inline <script> to swap it into place',
        'Selective hydration: React 18 hydrates each boundary independently as its chunk arrives, rather than waiting for the full page JavaScript to load',
        'Interaction priority: if a user clicks a not-yet-hydrated component, React hydrates that boundary first before others',
        'Trade-offs: requires a streaming-capable server (not all serverless/CDN edges support), waterfall SSR queries become more complex, and deeply nested Suspense can fragment the stream unnecessarily',
      ],
      followUps: [
        'How does Next.js App Router implement streaming SSR, and what is the loading.tsx file\'s role?',
        'What is the onShellReady vs onAllReady callback difference in renderToPipeableStream?',
        'How does streaming SSR interact with HTTP caching — can you cache a streamed response?',
      ],
      tags: ['streaming-ssr', 'suspense', 'selective-hydration', 'react-18', 'server-rendering'],
      childExplanation: "Normal SSR is like a restaurant that makes you wait at the door until every dish in your order is ready. Streaming SSR is like a progressive dinner — the appetiser arrives first and you start eating while the main course is still cooking.",
      detailedExplanation: `<h4>The Streaming Pipeline</h4>
<p>React sends HTML progressively. The browser starts parsing and rendering the shell while the server is still resolving data for suspended boundaries:</p>
<pre><code>// Server (Node.js)
const { pipe, abort } = renderToPipeableStream(
  &lt;App /&gt;,
  {
    onShellReady() { pipe(res); }, // send shell immediately when ready
    onError(err) { console.error(err); },
  }
);</code></pre>

<h4>How Chunks Are Delivered</h4>
<p>When a Suspense boundary resolves, React appends a hidden <code>&lt;template&gt;</code> to the HTML stream and a small inline <code>&lt;script&gt;</code> that removes the placeholder and inserts the real content. This is transparent to the browser — no additional round-trips.</p>

<h4>Selective Hydration</h4>
<p>React 18 uses a priority queue for hydration. Boundaries that the user interacts with (click, focus) are hydrated immediately; off-screen boundaries are deferred. This means a slow query at the bottom of the page doesn't block interactivity for content the user can already see.</p>

<h4>Key Trade-offs</h4>
<ul>
  <li><strong>Pro</strong>: TTFB and FCP improve because the shell arrives earlier</li>
  <li><strong>Pro</strong>: No more "all-or-nothing" SSR blocking on the slowest query</li>
  <li><strong>Con</strong>: Streaming requires HTTP/1.1 chunked transfer or HTTP/2 — some edge/CDN caches cannot cache streamed responses</li>
  <li><strong>Con</strong>: Over-splitting Suspense boundaries creates many small chunks; consolidate boundaries around data fetches, not layout</li>
</ul>

<div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>Calling onShellReady only streams the shell — but onAllReady waits for everything before streaming (useful for bots/crawlers that need full content). Always route Google's User-Agent to onAllReady to ensure full page indexing.</p></div>
<blockquote>Senior Insight: Streaming SSR is most valuable when a page has sections with very different data latencies — a fast nav + slow user feed. Wrapping only the slow sections in Suspense lets the fast sections arrive immediately. Don't wrap fast, synchronous sections in Suspense boundaries — it adds overhead without benefit.</blockquote>`,
      diagramSvg: svgs.streaming,
      quiz: {
        format: 'mcq',
        question: 'Which renderToPipeableStream callback should you use to start streaming the response as early as possible?',
        options: ['onAllReady', 'onShellReady', 'onShellError', 'onComplete'],
        answer: 1,
        explanation: 'onShellReady fires as soon as the synchronous shell is ready — before any Suspense boundaries resolve. Use it to start piping the response immediately for best TTFB. onAllReady waits for all content and is better for bots/search-engine crawlers.',
      },
    },
  ] as const;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════ */

async function main() {
  // Generate SVGs
  const svgs = {
    gen:        renderDiagramSpec(GEN_SPEC),
    proxy:      renderDiagramSpec(PROXY_SPEC),
    weakref:    renderDiagramSpec(WEAKREF_SPEC),
    ts:         renderDiagramSpec(TS_SPEC),
    longtask:   renderDiagramSpec(LONGTASK_SPEC),
    actions:    renderDiagramSpec(ACTIONS_SPEC),
    concurrent: renderDiagramSpec(CONCURRENT_SPEC),
    errbound:   renderDiagramSpec(ERRBOUND_SPEC),
    hook:       renderDiagramSpec(HOOK_SPEC),
    streaming:  renderDiagramSpec(STREAMING_SPEC),
  };

  const questions = buildQuestions(svgs);

  // Upsert JSON files
  const jsCount = upsertJson(
    'prisma/seed/questions/javascript.json',
    questions.filter((q) => q.topic === 'JavaScript'),
  );
  const reactCount = upsertJson(
    'prisma/seed/questions/react.json',
    questions.filter((q) => q.topic === 'React'),
  );
  console.log(`✓ javascript.json → ${jsCount} total`);
  console.log(`✓ react.json      → ${reactCount} total`);

  // Upsert to DB
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const q of questions) {
      const { diagramSvg, quiz, ...rest } = q as any;
      await prisma.seedQuestion.upsert({
        where: { id: q.id },
        update: { ...rest, diagramSvg, diagramMermaid: null, quiz: JSON.stringify(quiz), rubric: {} },
        create: { ...rest, diagramSvg, diagramMermaid: null, quiz: JSON.stringify(quiz), rubric: {} },
      });
      const vb = diagramSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const dims = vb ? `${vb[1]}×${vb[2]}` : '?';
      console.log(`  ✓ ${q.id.slice(0, 62)}  [${dims}]`);
    }
    console.log(`\n✅ Seeded ${questions.length} questions (JS: 5, React: 5)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
