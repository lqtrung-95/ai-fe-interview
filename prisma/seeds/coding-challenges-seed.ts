/**
 * Seeds 30 curated JavaScript coding challenges (junior → senior) for the coding challenges feature.
 * Run: pnpm seed:coding
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

type TestCase = {
  id: string;
  label: string;
  input: string;
  expected: string;
  isHidden: boolean;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  tags: string[];
  hints: string[];
  starterCode: string;
  testCases: TestCase[];
  solution: string;
  timeLimit: number;
};

const challenges: Challenge[] = [
  // ── cc-flatten ──────────────────────────────────────────────────────────────
  {
    id: 'cc-flatten',
    title: 'Flatten Nested Array',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['arrays', 'recursion'],
    description: `## Flatten Nested Array

Write a function \`solution(arr, depth)\` that flattens a nested array up to the given depth.

**Examples:**
\`\`\`js
solution([1, [2, 3]], 1)  // [1, 2, 3]
solution([1, [2, [3]]], 1) // [1, 2, [3]]
solution([1, [2, [3]]], 2) // [1, 2, 3]
\`\`\`

Do **not** use \`Array.prototype.flat\`.`,
    starterCode: `function solution(arr, depth = 1) {
  // Your implementation here
}`,
    solution: `function solution(arr, depth = 1) {
  if (depth === 0) return arr.slice();
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...solution(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}`,
    testCases: [
      { id: 'f1', label: 'depth 1 basic', input: '([1, [2, 3]], 1)', expected: '[1,2,3]', isHidden: false },
      { id: 'f2', label: 'depth 1 stops at 2 levels', input: '([1, [2, [3]]], 1)', expected: '[1,2,[3]]', isHidden: false },
      { id: 'f3', label: 'depth 2 fully flattens', input: '([1, [2, [3]]], 2)', expected: '[1,2,3]', isHidden: false },
      { id: 'f4', label: 'empty array', input: '([], 1)', expected: '[]', isHidden: true },
      { id: 'f5', label: 'already flat', input: '([1, 2, 3], 1)', expected: '[1,2,3]', isHidden: true },
    ],
hints: [
      'Think recursively: if the current item is an array and depth > 0, recurse into it with depth - 1.',
      'Use a loop over the items and push results into a result array. Spread the recursive result with `...`.',
      'Base case: if depth === 0, return a shallow copy of the array with no flattening.',
    ],
        timeLimit: 5000,
  },

  // ── cc-memoize ───────────────────────────────────────────────────────────────
  {
    id: 'cc-memoize',
    title: 'Implement Memoize',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['closures', 'performance', 'higher-order functions'],
    description: `## Implement Memoize

Write a function \`solution(fn)\` that returns a memoized version of \`fn\`. The memoized function caches results by serialising arguments as a JSON key.

**Example:**
\`\`\`js
let callCount = 0;
const add = (a, b) => { callCount++; return a + b; };
const memoAdd = solution(add);
memoAdd(1, 2); // 3 (callCount = 1)
memoAdd(1, 2); // 3 (callCount still 1, cached)
memoAdd(2, 3); // 5 (callCount = 2)
\`\`\``,
    starterCode: `function solution(fn) {
  // Return a memoized version of fn
}`,
    solution: `function solution(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
    testCases: [
      { id: 'm1', label: 'caches result on second call', input: '(() => { let n = 0; const fn = (x) => { n++; return x * 2; }; const m = solution(fn); m(5); m(5); return n; })()', expected: '1', isHidden: false },
      { id: 'm2', label: 'different args not cached', input: '(() => { let n = 0; const fn = (x) => { n++; return x; }; const m = solution(fn); m(1); m(2); return n; })()', expected: '2', isHidden: false },
      { id: 'm3', label: 'returns correct value', input: '(() => { const m = solution((a, b) => a + b); return m(3, 4); })()', expected: '7', isHidden: false },
      { id: 'm4', label: 'multi-arg cache key', input: '(() => { let n = 0; const fn = (a, b) => { n++; return a + b; }; const m = solution(fn); m(1, 2); m(2, 1); return n; })()', expected: '2', isHidden: true },
      { id: 'm5', label: 'works with zero args', input: '(() => { let n = 0; const fn = () => { n++; return 42; }; const m = solution(fn); m(); m(); return n; })()', expected: '1', isHidden: true },
    ],
hints: [
      'You need to cache results by the arguments passed. A `Map` works perfectly as the cache store.',
      'Serialize the arguments to a string key using `JSON.stringify(args)` to handle multiple arguments.',
      'Return a closure that checks the cache before calling `fn`, and stores the result after calling it.',
    ],
        timeLimit: 5000,
  },

  // ── cc-debounce ──────────────────────────────────────────────────────────────
  {
    id: 'cc-debounce',
    title: 'Implement Debounce',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['timers', 'closures', 'performance'],
    description: `## Implement Debounce

Write a function \`solution(fn, delay)\` that returns a debounced version of \`fn\`. The debounced function delays invoking \`fn\` until \`delay\` ms have elapsed since the last invocation.

**Example:**
\`\`\`js
const fn = solution(() => 'called', 100);
fn(); fn(); fn(); // only last call fires after 100ms
\`\`\``,
    starterCode: `function solution(fn, delay) {
  // Return a debounced version of fn
}`,
    solution: `function solution(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
    testCases: [
      { id: 'd1', label: 'returns a function', input: '(typeof solution(() => {}, 100))', expected: '"function"', isHidden: false },
      { id: 'd2', label: 'fires after delay when called once', input: '(() => { let count = 0; const db = solution(() => count++, 50); db(); return new Promise(r => setTimeout(() => r(count), 100)); })()', expected: '1', isHidden: false },
      { id: 'd3', label: 'multiple rapid calls fire once', input: '(() => { let count = 0; const db = solution(() => count++, 50); db(); db(); db(); return new Promise(r => setTimeout(() => r(count), 120)); })()', expected: '1', isHidden: false },
      { id: 'd4', label: 'two separate call groups each fire once', input: '(() => { let count = 0; const db = solution(() => count++, 50); db(); return new Promise(r => setTimeout(() => { db(); db(); setTimeout(() => r(count), 100); }, 150)); })()', expected: '2', isHidden: true },
      { id: 'd5', label: 'passes args to fn', input: '(() => { let got; const db = solution((x) => { got = x; }, 50); db(42); return new Promise(r => setTimeout(() => r(got), 100)); })()', expected: '42', isHidden: true },
    ],
hints: [
      'You need a timer that resets every time the function is called. `clearTimeout` + `setTimeout` is the pattern.',
      'Store the timer in a variable outside the returned function (closure). Each new call clears the old timer.',
      'Use `fn.apply(this, args)` inside the `setTimeout` callback to preserve `this` and pass arguments.',
    ],
        timeLimit: 5000,
  },

  // ── cc-throttle ──────────────────────────────────────────────────────────────
  {
    id: 'cc-throttle',
    title: 'Implement Throttle',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['timers', 'closures', 'performance'],
    description: `## Implement Throttle

Write a function \`solution(fn, limit)\` that returns a throttled version of \`fn\`. The throttled function invokes \`fn\` at most once per \`limit\` ms window.

**Example:**
\`\`\`js
const fn = solution(() => 'called', 100);
fn(); // fires immediately
fn(); // ignored — within 100ms window
\`\`\``,
    starterCode: `function solution(fn, limit) {
  // Return a throttled version of fn
}`,
    solution: `function solution(fn, limit) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}`,
    testCases: [
      { id: 't1', label: 'first call fires immediately', input: '(() => { let count = 0; const th = solution(() => count++, 100); th(); return count; })()', expected: '1', isHidden: false },
      { id: 't2', label: 'second immediate call ignored', input: '(() => { let count = 0; const th = solution(() => count++, 100); th(); th(); return count; })()', expected: '1', isHidden: false },
      { id: 't3', label: 'call after window fires', input: '(() => { let count = 0; const th = solution(() => count++, 50); th(); return new Promise(r => setTimeout(() => { th(); r(count); }, 100)); })()', expected: '2', isHidden: false },
      { id: 't4', label: 'returns function', input: '(typeof solution(() => {}, 100))', expected: '"function"', isHidden: true },
      { id: 't5', label: 'passes return value on first call', input: '(() => { const th = solution((x) => x * 2, 100); return th(5); })()', expected: '10', isHidden: true },
    ],
hints: [
      'Track when the function was last called using a `lastCall` timestamp variable in a closure.',
      'On each invocation, check if `Date.now() - lastCall >= limit`. If yes, call the function and update `lastCall`.',
      'Return the function\'s return value when it fires, and silently return `undefined` when throttled.',
    ],
        timeLimit: 5000,
  },

  // ── cc-deep-clone ────────────────────────────────────────────────────────────
  {
    id: 'cc-deep-clone',
    title: 'Deep Clone an Object',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['objects', 'recursion'],
    description: `## Deep Clone an Object

Write a function \`solution(obj)\` that returns a deep clone of the input. Support objects, arrays, and primitive values. You may assume no circular references or special types (Date, RegExp, etc.).

**Example:**
\`\`\`js
const a = { x: 1, y: { z: 2 } };
const b = solution(a);
b.y.z = 99;
a.y.z; // still 2
\`\`\``,
    starterCode: `function solution(obj) {
  // Deep clone obj
}`,
    solution: `function solution(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(solution);
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = solution(obj[key]);
  }
  return result;
}`,
    testCases: [
      { id: 'dc1', label: 'primitive passthrough', input: '(42)', expected: '42', isHidden: false },
      { id: 'dc2', label: 'nested object is independent', input: '(() => { const a = { x: { y: 1 } }; const b = solution(a); b.x.y = 99; return a.x.y; })()', expected: '1', isHidden: false },
      { id: 'dc3', label: 'nested array independent', input: '(() => { const a = { arr: [1, 2, 3] }; const b = solution(a); b.arr.push(4); return a.arr.length; })()', expected: '3', isHidden: false },
      { id: 'dc4', label: 'null returns null', input: '(null)', expected: 'null', isHidden: true },
      { id: 'dc5', label: 'deep nesting', input: '(() => { const a = { a: { b: { c: 42 } } }; const b = solution(a); b.a.b.c = 0; return a.a.b.c; })()', expected: '42', isHidden: true },
    ],
hints: [
      'Handle the base cases first: if the value is `null` or not an object, return it as-is (primitives).',
      'Arrays need special handling — use `Array.isArray()` to detect them and map over elements recursively.',
      'For plain objects, use `Object.keys()` to iterate and recursively clone each property value.',
    ],
        timeLimit: 5000,
  },

  // ── cc-promise-all ───────────────────────────────────────────────────────────
  {
    id: 'cc-promise-all',
    title: 'Implement Promise.all',
    difficulty: 'mid',
    topic: 'Async',
    tags: ['promises', 'async'],
    description: `## Implement Promise.all

Write a function \`solution(promises)\` that behaves like \`Promise.all\`: resolves with an array of results (in order) when all promises resolve, or rejects with the first rejection reason.

**Example:**
\`\`\`js
solution([Promise.resolve(1), Promise.resolve(2)]).then(r => r); // [1, 2]
solution([Promise.reject('err')]).catch(e => e); // 'err'
\`\`\``,
    starterCode: `function solution(promises) {
  // Return a promise that resolves/rejects like Promise.all
}`,
    solution: `function solution(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) { resolve([]); return; }
    const results = new Array(promises.length);
    let resolved = 0;
    promises.forEach((p, i) => {
      Promise.resolve(p).then(val => {
        results[i] = val;
        resolved++;
        if (resolved === promises.length) resolve(results);
      }).catch(reject);
    });
  });
}`,
    testCases: [
      { id: 'pa1', label: 'resolves all in order', input: '(solution([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]))', expected: '[1,2,3]', isHidden: false },
      { id: 'pa2', label: 'empty array resolves to []', input: '(solution([]))', expected: '[]', isHidden: false },
      { id: 'pa3', label: 'rejects on first failure', input: '(solution([Promise.resolve(1), Promise.reject("boom"), Promise.resolve(3)]).catch(e => e))', expected: '"boom"', isHidden: false },
      { id: 'pa4', label: 'works with plain values wrapped', input: '(solution([Promise.resolve("a"), Promise.resolve("b")]))', expected: '["a","b"]', isHidden: true },
      { id: 'pa5', label: 'single promise', input: '(solution([Promise.resolve(42)]))', expected: '[42]', isHidden: true },
    ],
hints: [
      'Create a new Promise that resolves when ALL input promises resolve, and rejects on the first rejection.',
      'Track how many promises have resolved using a counter. When it reaches `promises.length`, resolve with the results array.',
      'Preserve order: store each result at its original index (`results[i] = val`), not just push.',
    ],
        timeLimit: 5000,
  },

  // ── cc-promise-race ──────────────────────────────────────────────────────────
  {
    id: 'cc-promise-race',
    title: 'Implement Promise.race',
    difficulty: 'mid',
    topic: 'Async',
    tags: ['promises', 'async'],
    description: `## Implement Promise.race

Write a function \`solution(promises)\` that behaves like \`Promise.race\`: resolves or rejects with the result of whichever promise settles first.

**Example:**
\`\`\`js
const slow = new Promise(r => setTimeout(() => r('slow'), 200));
const fast = new Promise(r => setTimeout(() => r('fast'), 50));
solution([slow, fast]).then(r => r); // 'fast'
\`\`\``,
    starterCode: `function solution(promises) {
  // Return a promise that settles with the first settled promise
}`,
    solution: `function solution(promises) {
  return new Promise((resolve, reject) => {
    for (const p of promises) {
      Promise.resolve(p).then(resolve).catch(reject);
    }
  });
}`,
    testCases: [
      { id: 'pr1', label: 'resolves with fastest', input: '(solution([new Promise(r => setTimeout(() => r("slow"), 100)), Promise.resolve("fast")]))', expected: '"fast"', isHidden: false },
      { id: 'pr2', label: 'rejects when first rejects', input: '(solution([Promise.reject("err"), new Promise(r => setTimeout(() => r("ok"), 100))]).catch(e => e))', expected: '"err"', isHidden: false },
      { id: 'pr3', label: 'single resolved promise', input: '(solution([Promise.resolve(99)]))', expected: '99', isHidden: false },
      { id: 'pr4', label: 'already resolved wins', input: '(solution([Promise.resolve("win"), new Promise(r => setTimeout(() => r("lose"), 50))]))', expected: '"win"', isHidden: true },
      { id: 'pr5', label: 'resolves to correct value', input: '(solution([Promise.resolve(1), Promise.resolve(2)]))', expected: '1', isHidden: true },
    ],
hints: [
      'Create a new Promise and pass each input promise\'s resolve/reject directly to the outer Promise\'s handlers.',
      'Whichever promise settles first will call resolve or reject — the others are simply ignored.',
      'Wrap each input in `Promise.resolve(p)` to handle non-Promise values in the array.',
    ],
        timeLimit: 5000,
  },

  // ── cc-event-emitter ─────────────────────────────────────────────────────────
  {
    id: 'cc-event-emitter',
    title: 'Build EventEmitter Class',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['classes', 'patterns', 'events'],
    description: `## Build EventEmitter Class

Implement an \`EventEmitter\` class (returned by \`solution()\`) with three methods:
- \`on(event, listener)\` — register a listener
- \`off(event, listener)\` — remove a listener
- \`emit(event, ...args)\` — invoke all listeners for the event

**Example:**
\`\`\`js
const ee = solution();
const fn = (x) => console.log(x);
ee.on('data', fn);
ee.emit('data', 42); // logs 42
ee.off('data', fn);
ee.emit('data', 42); // nothing
\`\`\``,
    starterCode: `function solution() {
  // Return an EventEmitter instance with on, off, emit
}`,
    solution: `function solution() {
  const listeners = {};
  return {
    on(event, listener) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(listener);
    },
    off(event, listener) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(l => l !== listener);
    },
    emit(event, ...args) {
      if (!listeners[event]) return;
      listeners[event].forEach(l => l(...args));
    },
  };
}`,
    testCases: [
      { id: 'ee1', label: 'on + emit fires listener', input: '(() => { const ee = solution(); let v = 0; ee.on("x", () => v++); ee.emit("x"); return v; })()', expected: '1', isHidden: false },
      { id: 'ee2', label: 'off removes listener', input: '(() => { const ee = solution(); let v = 0; const fn = () => v++; ee.on("x", fn); ee.off("x", fn); ee.emit("x"); return v; })()', expected: '0', isHidden: false },
      { id: 'ee3', label: 'emit passes args', input: '(() => { const ee = solution(); let got; ee.on("x", (a, b) => { got = a + b; }); ee.emit("x", 3, 4); return got; })()', expected: '7', isHidden: false },
      { id: 'ee4', label: 'multiple listeners', input: '(() => { const ee = solution(); let v = 0; ee.on("x", () => v++); ee.on("x", () => v++); ee.emit("x"); return v; })()', expected: '2', isHidden: true },
      { id: 'ee5', label: 'emit with no listeners is safe', input: '(() => { const ee = solution(); try { ee.emit("unknown"); return true; } catch { return false; } })()', expected: 'true', isHidden: true },
    ],
hints: [
      'Store listeners in an object keyed by event name: `{ [event]: listener[] }`. Initialize the event array on first `on`.',
      '`emit` should loop over all listeners for the event and call each with the spread args.',
      '`off` should filter the specific listener reference out of the array. Use strict reference equality (===).',
    ],
        timeLimit: 5000,
  },

  // ── cc-compose ───────────────────────────────────────────────────────────────
  {
    id: 'cc-compose',
    title: 'Implement Compose/Pipe',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['functional', 'higher-order functions'],
    description: `## Implement Compose/Pipe

Write a function \`solution(fns)\` that takes an array of functions and returns a new function that applies them right-to-left (compose). The returned function passes its argument through each fn in reverse order.

**Example:**
\`\`\`js
const double = x => x * 2;
const addOne = x => x + 1;
const composed = solution([double, addOne]); // double(addOne(x))
composed(5); // double(addOne(5)) = double(6) = 12
\`\`\``,
    starterCode: `function solution(fns) {
  // Return a composed function (right-to-left)
}`,
    solution: `function solution(fns) {
  return function(x) {
    return fns.reduceRight((acc, fn) => fn(acc), x);
  };
}`,
    testCases: [
      { id: 'cp1', label: 'basic compose two fns', input: '(solution([x => x * 2, x => x + 1])(5))', expected: '12', isHidden: false },
      { id: 'cp2', label: 'single function passes through', input: '(solution([x => x * 3])(4))', expected: '12', isHidden: false },
      { id: 'cp3', label: 'three functions compose correctly', input: '(solution([x => x - 1, x => x * 2, x => x + 1])(5))', expected: '11', isHidden: false },
      { id: 'cp4', label: 'empty array is identity', input: '(solution([])(7))', expected: '7', isHidden: true },
      { id: 'cp5', label: 'works with strings', input: '(solution([s => s.toUpperCase(), s => s.trim()])("  hello  "))', expected: '"HELLO"', isHidden: true },
    ],
hints: [
      'Compose applies functions right-to-left: the last function in the array is called first.',
      'Use `Array.prototype.reduceRight` — it iterates from right to left, perfect for function composition.',
      'Each step passes its output as the input to the next function: `reduceRight((acc, fn) => fn(acc), x)`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-curry ─────────────────────────────────────────────────────────────────
  {
    id: 'cc-curry',
    title: 'Implement Curry',
    difficulty: 'senior',
    topic: 'JavaScript',
    tags: ['functional', 'closures', 'higher-order functions'],
    description: `## Implement Curry

Write a function \`solution(fn)\` that returns a curried version of \`fn\`. The curried function should collect arguments until it has enough to call the original function, then call it.

**Example:**
\`\`\`js
const add = (a, b, c) => a + b + c;
const curried = solution(add);
curried(1)(2)(3); // 6
curried(1, 2)(3); // 6
curried(1)(2, 3); // 6
\`\`\``,
    starterCode: `function solution(fn) {
  // Return a curried version of fn
}`,
    solution: `function solution(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}`,
    testCases: [
      { id: 'cy1', label: 'curried one at a time', input: '(solution((a, b, c) => a + b + c)(1)(2)(3))', expected: '6', isHidden: false },
      { id: 'cy2', label: 'curried in groups', input: '(solution((a, b, c) => a + b + c)(1, 2)(3))', expected: '6', isHidden: false },
      { id: 'cy3', label: 'all args at once', input: '(solution((a, b, c) => a + b + c)(1, 2, 3))', expected: '6', isHidden: false },
      { id: 'cy4', label: 'single-arg function', input: '(solution(x => x * 2)(5))', expected: '10', isHidden: true },
      { id: 'cy5', label: 'two-arg partial application', input: '(() => { const add = solution((a, b) => a + b); const add5 = add(5); return add5(3); })()', expected: '8', isHidden: true },
    ],
hints: [
      'A curried function collects arguments until it has enough to call the original. Check `args.length >= fn.length`.',
      'If not enough args yet, return a new function that concatenates the new args with the already-collected ones.',
      'Use recursion: the returned function is the curried function itself, called with `args.concat(moreArgs)`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-use-debounce ──────────────────────────────────────────────────────────
  {
    id: 'cc-use-debounce',
    title: 'Implement useDebounce Hook',
    difficulty: 'mid',
    topic: 'React',
    tags: ['hooks', 'React', 'timers'],
    description: `## Implement useDebounce Hook

Write a function \`solution(useStateFn, useEffectFn)\` that takes mock React hook factories and returns a \`useDebounce(value, delay)\` hook factory. The hook should return the debounced version of \`value\`, updating only after \`delay\` ms have passed since \`value\` last changed.

For this challenge, use the provided \`useStateFn\` and \`useEffectFn\` as stand-ins for React's \`useState\` and \`useEffect\`.

**Example:**
\`\`\`js
// In real React:
// function useDebounce(value, delay) {
//   const [debouncedValue, setDebouncedValue] = useState(value);
//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedValue(value), delay);
//     return () => clearTimeout(timer);
//   }, [value, delay]);
//   return debouncedValue;
// }
\`\`\`

Implement this logic inside \`solution\`.`,
    starterCode: `function solution(useStateFn, useEffectFn) {
  // Return a useDebounce(value, delay) function
  return function useDebounce(value, delay) {
    // Your implementation here
  };
}`,
    solution: `function solution(useStateFn, useEffectFn) {
  return function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useStateFn(value);
    useEffectFn(() => {
      const timer = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
  };
}`,
    testCases: [
      { id: 'ud1', label: 'returns initial value immediately', input: '(() => { let state = "init"; const useState = (v) => [v, (nv) => { state = nv; }]; const useEffect = (fn) => { const cleanup = fn(); if (cleanup) cleanup(); }; const useDebounce = solution(useState, useEffect); return useDebounce("init", 100); })()', expected: '"init"', isHidden: false },
      { id: 'ud2', label: 'returns a function', input: '(typeof solution((v) => [v, () => {}], () => {}))', expected: '"function"', isHidden: false },
      { id: 'ud3', label: 'debounce hook is callable', input: '(() => { const useDebounce = solution((v) => [v, () => {}], (fn) => fn()); try { useDebounce("test", 50); return true; } catch { return false; } })()', expected: 'true', isHidden: false },
      { id: 'ud4', label: 'cleanup is called on effect teardown', input: '(() => { let cleanedUp = false; const useEffect = (fn) => { const cleanup = fn(); if (typeof cleanup === "function") { cleanedUp = true; } }; const useDebounce = solution((v) => [v, () => {}], useEffect); useDebounce("val", 100); return cleanedUp; })()', expected: 'true', isHidden: true },
      { id: 'ud5', label: 'state setter is a function', input: '(() => { let setterIsFunction = false; const useState = (v) => { const setter = (nv) => {}; setterIsFunction = typeof setter === "function"; return [v, setter]; }; solution(useState, (fn) => fn())("a", 50); return setterIsFunction; })()', expected: 'true', isHidden: true },
    ],
hints: [
      'This is a React hook — it uses `useState` to hold the debounced value and `useEffect` to set up a timer.',
      'In the `useEffect`, call `setTimeout(() => setDebouncedValue(value), delay)` and return a cleanup that calls `clearTimeout`.',
      'The `useEffect` dependency array should be `[value, delay]` so the timer resets whenever value or delay changes.',
    ],
        timeLimit: 5000,
  },

  // ── cc-virtual-dom-diff ──────────────────────────────────────────────────────
  {
    id: 'cc-virtual-dom-diff',
    title: 'Diff Two Virtual DOM Trees',
    difficulty: 'senior',
    topic: 'React',
    tags: ['algorithms', 'React', 'trees'],
    description: `## Diff Two Virtual DOM Trees

Write a function \`solution(oldNode, newNode)\` that computes a diff between two virtual DOM nodes and returns a list of patch operations.

Each node has the shape: \`{ type: string, props: object, children: Node[] } | null\`

Return an array of patch objects. Supported patch types:
- \`{ op: 'replace', node: newNode }\` — type changed, replace entire subtree
- \`{ op: 'update', props: changedProps }\` — same type, props changed
- \`{ op: 'remove' }\` — node removed
- \`{ op: 'add', node: newNode }\` — node added
- \`{ op: 'none' }\` — no change

Only diff at the root level (no recursive children diff needed for this exercise).

**Example:**
\`\`\`js
solution({ type: 'div', props: { id: 'a' }, children: [] },
         { type: 'div', props: { id: 'b' }, children: [] });
// [{ op: 'update', props: { id: 'b' } }]
\`\`\``,
    starterCode: `function solution(oldNode, newNode) {
  // Return array of patch operations
}`,
    solution: `function solution(oldNode, newNode) {
  if (!oldNode && !newNode) return [{ op: 'none' }];
  if (!oldNode) return [{ op: 'add', node: newNode }];
  if (!newNode) return [{ op: 'remove' }];
  if (oldNode.type !== newNode.type) return [{ op: 'replace', node: newNode }];
  const changedProps = {};
  const allKeys = new Set([...Object.keys(oldNode.props), ...Object.keys(newNode.props)]);
  for (const key of allKeys) {
    if (oldNode.props[key] !== newNode.props[key]) {
      changedProps[key] = newNode.props[key];
    }
  }
  if (Object.keys(changedProps).length > 0) return [{ op: 'update', props: changedProps }];
  return [{ op: 'none' }];
}`,
    testCases: [
      { id: 'vd1', label: 'same node returns none', input: '(solution({ type: "div", props: {}, children: [] }, { type: "div", props: {}, children: [] }))', expected: '[{"op":"none"}]', isHidden: false },
      { id: 'vd2', label: 'different type returns replace', input: '(solution({ type: "div", props: {}, children: [] }, { type: "span", props: {}, children: [] }))', expected: '[{"op":"replace","node":{"type":"span","props":{},"children":[]}}]', isHidden: false },
      { id: 'vd3', label: 'changed prop returns update', input: '(solution({ type: "div", props: { id: "a" }, children: [] }, { type: "div", props: { id: "b" }, children: [] }))', expected: '[{"op":"update","props":{"id":"b"}}]', isHidden: false },
      { id: 'vd4', label: 'null old returns add', input: '(solution(null, { type: "p", props: {}, children: [] }))', expected: '[{"op":"add","node":{"type":"p","props":{},"children":[]}}]', isHidden: true },
      { id: 'vd5', label: 'null new returns remove', input: '(solution({ type: "div", props: {}, children: [] }, null))', expected: '[{"op":"remove"}]', isHidden: true },
    ],
hints: [
      'Handle null nodes first: if old is null return `add`, if new is null return `remove`, if both null return `none`.',
      'If types differ, the entire subtree needs to be replaced — return `replace` with the new node.',
      'If types match, compare props: iterate all keys from both old and new props to find changed values.',
    ],
        timeLimit: 5000,
  },

  // ── cc-observable ────────────────────────────────────────────────────────────
  {
    id: 'cc-observable',
    title: 'Implement Simple Observable',
    difficulty: 'senior',
    topic: 'Async',
    tags: ['reactive', 'patterns', 'async'],
    description: `## Implement Simple Observable

Write a function \`solution(subscribeFn)\` that returns an observable object. The observable must have a \`subscribe(observer)\` method where \`observer\` is \`{ next, error, complete }\`.

Calling \`subscribe\` should invoke \`subscribeFn(observer)\` and return a subscription object with \`unsubscribe()\`.

**Example:**
\`\`\`js
const obs = solution(observer => {
  observer.next(1);
  observer.next(2);
  observer.complete();
});
obs.subscribe({
  next: v => console.log(v),     // logs 1, 2
  complete: () => console.log('done'),
});
\`\`\``,
    starterCode: `function solution(subscribeFn) {
  // Return an observable with a subscribe(observer) method
}`,
    solution: `function solution(subscribeFn) {
  return {
    subscribe(observer) {
      let active = true;
      const safeObserver = {
        next(v) { if (active) observer.next?.(v); },
        error(e) { if (active) { active = false; observer.error?.(e); } },
        complete() { if (active) { active = false; observer.complete?.(); } },
      };
      const cleanup = subscribeFn(safeObserver);
      return {
        unsubscribe() {
          active = false;
          cleanup?.();
        },
      };
    },
  };
}`,
    testCases: [
      { id: 'ob1', label: 'next values received in order', input: '(() => { const vals = []; solution(o => { o.next(1); o.next(2); }).subscribe({ next: v => vals.push(v) }); return vals; })()', expected: '[1,2]', isHidden: false },
      { id: 'ob2', label: 'complete called', input: '(() => { let done = false; solution(o => { o.complete(); }).subscribe({ complete: () => { done = true; } }); return done; })()', expected: 'true', isHidden: false },
      { id: 'ob3', label: 'unsubscribe stops next emissions', input: '(() => { let count = 0; let sub; const obs = solution(o => { sub = { next: (v) => o.next(v) }; }); const s = obs.subscribe({ next: () => count++ }); s.unsubscribe(); sub.next(1); return count; })()', expected: '0', isHidden: false },
      { id: 'ob4', label: 'error is propagated', input: '(() => { let caught; solution(o => { o.error("boom"); }).subscribe({ error: e => { caught = e; } }); return caught; })()', expected: '"boom"', isHidden: true },
      { id: 'ob5', label: 'subscribe returns object with unsubscribe', input: '(() => { const s = solution(() => {}).subscribe({}); return typeof s.unsubscribe; })()', expected: '"function"', isHidden: true },
    ],
hints: [
      'An observable wraps a `subscribeFn` and calls it with a safe observer when `.subscribe()` is called.',
      'The safe observer should track an `active` flag — once `complete()` or `error()` is called, ignore further emissions.',
      '`.subscribe()` should return a subscription object with `.unsubscribe()` that sets `active = false` and calls any cleanup returned by `subscribeFn`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-lru-cache ─────────────────────────────────────────────────────────────
  {
    id: 'cc-lru-cache',
    title: 'LRU Cache Implementation',
    difficulty: 'senior',
    topic: 'JavaScript',
    tags: ['data structures', 'algorithms', 'Map'],
    description: `## LRU Cache Implementation

Implement an LRU (Least Recently Used) cache class. \`solution(capacity)\` returns an object with:
- \`get(key)\` — returns value or -1 if not found; marks as recently used
- \`put(key, value)\` — inserts/updates; evicts LRU entry if at capacity

**Example:**
\`\`\`js
const cache = solution(2);
cache.put(1, 1); // cache: {1=1}
cache.put(2, 2); // cache: {1=1, 2=2}
cache.get(1);    // 1 — mark 1 as recently used
cache.put(3, 3); // evict 2 (LRU), cache: {1=1, 3=3}
cache.get(2);    // -1 (evicted)
\`\`\``,
    starterCode: `function solution(capacity) {
  // Return an object with get(key) and put(key, value)
}`,
    solution: `function solution(capacity) {
  const cache = new Map();
  return {
    get(key) {
      if (!cache.has(key)) return -1;
      const val = cache.get(key);
      cache.delete(key);
      cache.set(key, val);
      return val;
    },
    put(key, value) {
      if (cache.has(key)) cache.delete(key);
      cache.set(key, value);
      if (cache.size > capacity) {
        cache.delete(cache.keys().next().value);
      }
    },
  };
}`,
    testCases: [
      { id: 'lru1', label: 'get returns -1 for missing key', input: '(() => { const c = solution(2); return c.get(1); })()', expected: '-1', isHidden: false },
      { id: 'lru2', label: 'put and get basic', input: '(() => { const c = solution(2); c.put(1, 10); return c.get(1); })()', expected: '10', isHidden: false },
      { id: 'lru3', label: 'evicts LRU on capacity', input: '(() => { const c = solution(2); c.put(1, 1); c.put(2, 2); c.get(1); c.put(3, 3); return c.get(2); })()', expected: '-1', isHidden: false },
      { id: 'lru4', label: 'update does not change capacity', input: '(() => { const c = solution(2); c.put(1, 1); c.put(2, 2); c.put(1, 10); c.put(3, 3); return c.get(2); })()', expected: '-1', isHidden: true },
      { id: 'lru5', label: 'capacity 1 always evicts previous', input: '(() => { const c = solution(1); c.put(1, 1); c.put(2, 2); return c.get(1); })()', expected: '-1', isHidden: true },
    ],
hints: [
      'A `Map` in JavaScript preserves insertion order. You can use this to track LRU: delete + re-insert on access to move to \'most recent\'.',
      'For `get`: if the key exists, delete it and re-insert it (makes it most recent), then return the value.',
      'For `put`: if key exists, delete it first. Insert the new key-value. If size exceeds capacity, delete the first key (`cache.keys().next().value`).',
    ],
        timeLimit: 5000,
  },

  // ── cc-retry ─────────────────────────────────────────────────────────────────
  {
    id: 'cc-retry',
    title: 'Implement Retry with Backoff',
    difficulty: 'mid',
    topic: 'Async',
    tags: ['async', 'error handling', 'promises'],
    description: `## Implement Retry with Backoff

Write a function \`solution(fn, retries, delay)\` that calls \`fn()\` (which returns a promise) up to \`retries\` times on failure. Between each retry, wait \`delay\` ms. If all attempts fail, reject with the last error.

**Example:**
\`\`\`js
let attempts = 0;
const fn = () => new Promise((res, rej) => {
  attempts++;
  attempts < 3 ? rej('fail') : res('ok');
});
solution(fn, 3, 10).then(v => v); // 'ok' (succeeded on 3rd attempt)
\`\`\``,
    starterCode: `function solution(fn, retries, delay) {
  // Return a promise that retries fn on failure
}`,
    solution: `function solution(fn, retries, delay) {
  return new Promise((resolve, reject) => {
    function attempt(remaining) {
      fn().then(resolve).catch(err => {
        if (remaining <= 1) {
          reject(err);
        } else {
          setTimeout(() => attempt(remaining - 1), delay);
        }
      });
    }
    attempt(retries);
  });
}`,
    testCases: [
      { id: 'rt1', label: 'resolves on first success', input: '(solution(() => Promise.resolve("ok"), 3, 10))', expected: '"ok"', isHidden: false },
      { id: 'rt2', label: 'retries and succeeds on 3rd attempt', input: '(() => { let n = 0; return solution(() => new Promise((res, rej) => { n++; n < 3 ? rej("fail") : res("ok"); }), 3, 10); })()', expected: '"ok"', isHidden: false },
      { id: 'rt3', label: 'rejects after all retries exhausted', input: '(solution(() => Promise.reject("err"), 2, 10).catch(e => e))', expected: '"err"', isHidden: false },
      { id: 'rt4', label: 'attempt count matches retries', input: '(() => { let n = 0; return solution(() => { n++; return Promise.reject("x"); }, 3, 10).catch(() => n); })()', expected: '3', isHidden: true },
      { id: 'rt5', label: 'resolves with correct value', input: '(solution(() => Promise.resolve(42), 1, 0))', expected: '42', isHidden: true },
    ],
hints: [
      'Use recursion: create an inner `attempt(remaining)` function that calls `fn()` and retries on failure.',
      'On rejection, check `remaining <= 1` — if so, reject the outer promise with the error. Otherwise, call `setTimeout(() => attempt(remaining - 1), delay)`.',
      'Wrap everything in a `new Promise((resolve, reject) => { attempt(retries); })` so the caller can await the final result.',
    ],
        timeLimit: 5000,
  },

  // ── cc-chunk-array ───────────────────────────────────────────────────────────
  {
    id: 'cc-chunk-array',
    title: 'Chunk Array',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['arrays', 'iteration'],
    description: `## Chunk Array

Write a function \`solution(arr, size)\` that splits \`arr\` into groups of length \`size\`. The last group may be smaller if the array doesn't divide evenly.

**Examples:**
\`\`\`js
solution([1, 2, 3, 4, 5], 2) // [[1,2],[3,4],[5]]
solution([1, 2, 3, 4], 2)    // [[1,2],[3,4]]
solution([], 3)               // []
\`\`\`

Do **not** use \`Array.prototype.flat\`.`,
    starterCode: `function solution(arr, size) {
  // Your implementation here
}`,
    solution: `function solution(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}`,
    testCases: [
      { id: 'ca1', label: 'splits into groups of 2', input: '([1,2,3,4,5], 2)', expected: '[[1,2],[3,4],[5]]', isHidden: false },
      { id: 'ca2', label: 'even split', input: '([1,2,3,4], 2)', expected: '[[1,2],[3,4]]', isHidden: false },
      { id: 'ca3', label: 'strings chunk', input: '(["a","b","c","d","e"], 3)', expected: '[["a","b","c"],["d","e"]]', isHidden: false },
      { id: 'ca4', label: 'empty array', input: '([], 3)', expected: '[]', isHidden: true },
      { id: 'ca5', label: 'size larger than array', input: '([1,2], 10)', expected: '[[1,2]]', isHidden: true },
    ],
hints: [
      'Loop from 0 to `arr.length` in steps of `size`. On each step, extract a slice of the array.',
      'Use `arr.slice(i, i + size)` — it automatically handles the last chunk being smaller than `size`.',
      'Push each slice into a result array and return it.',
    ],
        timeLimit: 5000,
  },

  // ── cc-once ──────────────────────────────────────────────────────────────────
  {
    id: 'cc-once',
    title: 'Implement Once',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['closures', 'higher-order functions'],
    description: `## Implement Once

Write a function \`solution(fn)\` that returns a new function which calls \`fn\` only on the **first** invocation. All subsequent calls return the cached result from the first call without calling \`fn\` again.

**Example:**
\`\`\`js
let count = 0;
const inc = solution(() => ++count);
inc(); // 1  (fn called)
inc(); // 1  (cached — fn NOT called again)
inc(); // 1
count; // 1
\`\`\``,
    starterCode: `function solution(fn) {
  // Return a function that only calls fn once
}`,
    solution: `function solution(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}`,
    testCases: [
      { id: 'on1', label: 'fn only called once despite multiple calls', input: '(() => { let n = 0; const fn = solution(() => ++n); fn(); fn(); fn(); return n; })()', expected: '1', isHidden: false },
      { id: 'on2', label: 'returns first call result on all subsequent calls', input: '(() => { const fn = solution((x) => x * 2); return [fn(5), fn(99), fn(0)]; })()', expected: '[10,10,10]', isHidden: false },
      { id: 'on3', label: 'returns a function', input: '(typeof solution(() => {}))', expected: '"function"', isHidden: false },
      { id: 'on4', label: 'works with no args', input: '(() => { const fn = solution(() => 42); return fn(); })()', expected: '42', isHidden: true },
      { id: 'on5', label: 'caches undefined return', input: '(() => { let n = 0; const fn = solution(() => { n++; }); fn(); fn(); return n; })()', expected: '1', isHidden: true },
    ],
hints: [
      'Use a closure with a `called` boolean flag and a `result` variable to cache the first return value.',
      'On the first invocation, set `called = true`, call `fn` and store the result. On all subsequent calls, just return the cached result.',
      'Use `fn.apply(this, args)` to correctly pass `this` and spread arguments to the original function.',
    ],
        timeLimit: 5000,
  },

  // ── cc-group-by ──────────────────────────────────────────────────────────────
  {
    id: 'cc-group-by',
    title: 'Group Array By Key',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['arrays', 'objects', 'functional'],
    description: `## Group Array By Key

Write a function \`solution(arr, fn)\` that groups the elements of \`arr\` by the string key returned by \`fn(element)\`.

**Example:**
\`\`\`js
solution(['one', 'two', 'three'], s => s.length)
// { '3': ['one', 'two'], '5': ['three'] }

solution([6.1, 4.2, 6.3], Math.floor)
// { '4': [4.2], '6': [6.1, 6.3] }
\`\`\``,
    starterCode: `function solution(arr, fn) {
  // Group arr items by the value of fn(item)
}`,
    solution: `function solution(arr, fn) {
  return arr.reduce((groups, item) => {
    const key = String(fn(item));
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}`,
    testCases: [
      { id: 'gb1', label: 'groups by string length', input: '(["a","bb","c","dd"], s => s.length)', expected: '{"1":["a","c"],"2":["bb","dd"]}', isHidden: false },
      { id: 'gb2', label: 'groups numbers by floor', input: '([6.1,4.2,6.3], Math.floor)', expected: '{"6":[6.1,6.3],"4":[4.2]}', isHidden: false },
      { id: 'gb3', label: 'single group', input: '([1,2,3], () => "all")', expected: '{"all":[1,2,3]}', isHidden: false },
      { id: 'gb4', label: 'empty array', input: '([], x => x)', expected: '{}', isHidden: true },
      { id: 'gb5', label: 'groups by boolean', input: '([1,2,3,4,5], n => n % 2 === 0)', expected: '{"false":[1,3,5],"true":[2,4]}', isHidden: true },
    ],
hints: [
      'Use `Array.prototype.reduce` to build up the groups object. Start with an empty object `{}`.',
      'For each item, compute the key with `String(fn(item))`. If the key doesn\'t exist yet, initialize it as an empty array.',
      'Push the item into the array at that key: `groups[key].push(item)`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-pick ──────────────────────────────────────────────────────────────────
  {
    id: 'cc-pick',
    title: 'Implement Pick',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['objects', 'utility'],
    description: `## Implement Pick

Write a function \`solution(obj, keys)\` that returns a new object with only the specified \`keys\` from \`obj\`. Keys that don't exist on \`obj\` are ignored.

**Example:**
\`\`\`js
solution({ a: 1, b: 2, c: 3 }, ['a', 'c'])
// { a: 1, c: 3 }

solution({ x: 10 }, ['x', 'y'])
// { x: 10 }   (y is ignored)
\`\`\``,
    starterCode: `function solution(obj, keys) {
  // Return a new object with only the given keys
}`,
    solution: `function solution(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
}`,
    testCases: [
      { id: 'pk1', label: 'picks specified keys', input: '({a:1,b:2,c:3}, ["a","c"])', expected: '{"a":1,"c":3}', isHidden: false },
      { id: 'pk2', label: 'ignores missing keys', input: '({x:10}, ["x","y"])', expected: '{"x":10}', isHidden: false },
      { id: 'pk3', label: 'picks all keys', input: '({a:1,b:2}, ["a","b"])', expected: '{"a":1,"b":2}', isHidden: false },
      { id: 'pk4', label: 'empty keys array', input: '({a:1,b:2}, [])', expected: '{}', isHidden: true },
      { id: 'pk5', label: 'no matching keys', input: '({a:1}, ["x","y"])', expected: '{}', isHidden: true },
    ],
hints: [
      'Iterate over the `keys` array (not over the object) so you only consider the requested keys.',
      'Use `key in obj` (not `obj[key]`) to check existence — this handles keys with `undefined` or falsy values correctly.',
      'Build the result with `reduce`: start with `{}` and add each found key.',
    ],
        timeLimit: 5000,
  },

  // ── cc-pipe ──────────────────────────────────────────────────────────────────
  {
    id: 'cc-pipe',
    title: 'Implement Pipe',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['functional', 'higher-order functions'],
    description: `## Implement Pipe

Write a function \`solution(fns)\` that returns a new function applying the given functions **left-to-right** (opposite of compose). Each function receives the output of the previous one.

**Example:**
\`\`\`js
const addOne  = x => x + 1;
const double  = x => x * 2;
const piped = solution([addOne, double]); // double(addOne(x))
piped(5); // (5 + 1) * 2 = 12
\`\`\``,
    starterCode: `function solution(fns) {
  // Return a piped function (left-to-right)
}`,
    solution: `function solution(fns) {
  return function(x) {
    return fns.reduce((acc, fn) => fn(acc), x);
  };
}`,
    testCases: [
      { id: 'pp1', label: 'basic left-to-right', input: '(solution([x => x + 1, x => x * 2])(5))', expected: '12', isHidden: false },
      { id: 'pp2', label: 'single function', input: '(solution([x => x * 3])(4))', expected: '12', isHidden: false },
      { id: 'pp3', label: 'three functions', input: '(solution([x => x + 1, x => x * 2, x => x - 1])(5))', expected: '11', isHidden: false },
      { id: 'pp4', label: 'empty is identity', input: '(solution([])(7))', expected: '7', isHidden: true },
      { id: 'pp5', label: 'strings', input: '(solution([s => s.trim(), s => s.toUpperCase()])("  hello  "))', expected: '"HELLO"', isHidden: true },
    ],
hints: [
      'Pipe is the left-to-right version of compose. Use `Array.prototype.reduce` (not `reduceRight`).',
      'Each function receives the output of the previous: `reduce((acc, fn) => fn(acc), x)`.',
      'An empty array of functions should act as an identity function — `reduce` with initial value `x` handles this automatically.',
    ],
        timeLimit: 5000,
  },

  // ── cc-intersection ──────────────────────────────────────────────────────────
  {
    id: 'cc-intersection',
    title: 'Array Intersection',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['arrays', 'Set'],
    description: `## Array Intersection

Write a function \`solution(a, b)\` that returns an array of unique values present in **both** \`a\` and \`b\`. Order follows \`a\`. No duplicates in the result.

**Examples:**
\`\`\`js
solution([1, 2, 3, 4], [2, 4, 6])   // [2, 4]
solution([1, 1, 2, 3], [1, 2])       // [1, 2]
solution([1, 2], [3, 4])             // []
\`\`\``,
    starterCode: `function solution(a, b) {
  // Return unique values present in both arrays
}`,
    solution: `function solution(a, b) {
  const setB = new Set(b);
  return [...new Set(a.filter(x => setB.has(x)))];
}`,
    testCases: [
      { id: 'ix1', label: 'basic intersection', input: '([1,2,3,4], [2,4,6])', expected: '[2,4]', isHidden: false },
      { id: 'ix2', label: 'deduplicates result', input: '([1,1,2,3], [1,2])', expected: '[1,2]', isHidden: false },
      { id: 'ix3', label: 'no common elements', input: '([1,2], [3,4])', expected: '[]', isHidden: false },
      { id: 'ix4', label: 'identical arrays', input: '([1,2,3], [1,2,3])', expected: '[1,2,3]', isHidden: true },
      { id: 'ix5', label: 'empty first array', input: '([], [1,2,3])', expected: '[]', isHidden: true },
    ],
hints: [
      'Convert one array to a `Set` for O(1) lookups, then filter the other array by membership in the Set.',
      'Deduplicate the result by wrapping the filtered array in another `Set`, then spread back to an array.',
      'Filter `a` (not `b`) to preserve `a`\'s order in the result.',
    ],
        timeLimit: 5000,
  },

  // ── cc-zip ───────────────────────────────────────────────────────────────────
  {
    id: 'cc-zip',
    title: 'Zip Arrays',
    difficulty: 'junior',
    topic: 'JavaScript',
    tags: ['arrays', 'iteration'],
    description: `## Zip Arrays

Write a function \`solution(...arrays)\` that zips multiple arrays together into an array of tuples. The output length equals the length of the **shortest** input array.

**Examples:**
\`\`\`js
solution([1, 2, 3], ['a', 'b', 'c'])
// [[1,'a'], [2,'b'], [3,'c']]

solution([1, 2], ['a', 'b'], [true, false])
// [[1,'a',true], [2,'b',false]]

solution([1, 2, 3], ['a'])
// [[1,'a']]   (length of shortest)
\`\`\``,
    starterCode: `function solution(...arrays) {
  // Zip arrays into tuples, truncating to shortest length
}`,
    solution: `function solution(...arrays) {
  const len = Math.min(...arrays.map(a => a.length));
  return Array.from({ length: len }, (_, i) => arrays.map(a => a[i]));
}`,
    testCases: [
      { id: 'zp1', label: 'zips two arrays', input: '([1,2,3], ["a","b","c"])', expected: '[[1,"a"],[2,"b"],[3,"c"]]', isHidden: false },
      { id: 'zp2', label: 'zips three arrays', input: '([1,2], ["a","b"], [true,false])', expected: '[[1,"a",true],[2,"b",false]]', isHidden: false },
      { id: 'zp3', label: 'truncates to shortest', input: '([1,2,3], ["a"])', expected: '[[1,"a"]]', isHidden: false },
      { id: 'zp4', label: 'empty array gives empty result', input: '([], [1,2,3])', expected: '[]', isHidden: true },
      { id: 'zp5', label: 'single array wraps elements', input: '([1,2,3])', expected: '[[1],[2],[3]]', isHidden: true },
    ],
hints: [
      'Find the length of the shortest input array using `Math.min(...arrays.map(a => a.length))`.',
      'Use `Array.from({ length: minLen }, (_, i) => ...)` to create the result array of tuples.',
      'Each tuple is built by mapping over all arrays: `arrays.map(a => a[i])`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-deep-equal ────────────────────────────────────────────────────────────
  {
    id: 'cc-deep-equal',
    title: 'Deep Equality Check',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['objects', 'recursion', 'comparison'],
    description: `## Deep Equality Check

Write a function \`solution(a, b)\` that returns \`true\` if \`a\` and \`b\` are deeply equal, \`false\` otherwise. Support primitives, arrays, and plain objects. No circular references.

**Examples:**
\`\`\`js
solution({ x: 1, y: { z: 2 } }, { x: 1, y: { z: 2 } }) // true
solution({ x: 1 }, { x: 2 })                             // false
solution([1, [2, 3]], [1, [2, 3]])                        // true
solution(null, null)                                       // true
\`\`\``,
    starterCode: `function solution(a, b) {
  // Return true if a and b are deeply equal
}`,
    solution: `function solution(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => solution(a[key], b[key]));
}`,
    testCases: [
      { id: 'de1', label: 'equal nested objects', input: '({x:1,y:{z:2}}, {x:1,y:{z:2}})', expected: 'true', isHidden: false },
      { id: 'de2', label: 'different values', input: '({x:1}, {x:2})', expected: 'false', isHidden: false },
      { id: 'de3', label: 'equal nested arrays', input: '([1,[2,3]], [1,[2,3]])', expected: 'true', isHidden: false },
      { id: 'de4', label: 'null equals null', input: '(null, null)', expected: 'true', isHidden: true },
      { id: 'de5', label: 'array vs object not equal', input: '([], {})', expected: 'false', isHidden: true },
    ],
hints: [
      'Start with the base case: if `a === b`, return `true` (handles primitives and same references).',
      'If either is `null` or not an object, return false (one is primitive, the other isn\'t).',
      'For objects: compare key counts, then recursively check each key\'s value using the same function.',
    ],
        timeLimit: 5000,
  },

  // ── cc-object-path-get ───────────────────────────────────────────────────────
  {
    id: 'cc-object-path-get',
    title: 'Get Nested Object Value by Path',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['objects', 'utility', 'lodash-style'],
    description: `## Get Nested Object Value by Path

Write a function \`solution(obj, path)\` that retrieves the value at the dot-separated \`path\` in \`obj\`. Return \`null\` if any segment of the path doesn't exist.

**Examples:**
\`\`\`js
solution({ a: { b: { c: 42 } } }, 'a.b.c') // 42
solution({ a: { b: 1 } }, 'a.x')           // null
solution({ arr: [1, 2, 3] }, 'arr.0')       // 1
\`\`\``,
    starterCode: `function solution(obj, path) {
  // Traverse obj following the dot-separated path
}`,
    solution: `function solution(obj, path) {
  const result = path.split('.').reduce((curr, key) => (curr == null ? null : curr[key] ?? null), obj);
  return result == null ? null : result;
}`,
    testCases: [
      { id: 'op1', label: 'retrieves deeply nested value', input: '({a:{b:{c:42}}}, "a.b.c")', expected: '42', isHidden: false },
      { id: 'op2', label: 'returns null for missing path', input: '({a:{b:1}}, "a.x")', expected: 'null', isHidden: false },
      { id: 'op3', label: 'array index via dot notation', input: '({arr:[10,20,30]}, "arr.1")', expected: '20', isHidden: false },
      { id: 'op4', label: 'top-level key', input: '({x:99}, "x")', expected: '99', isHidden: true },
      { id: 'op5', label: 'nested null returns null', input: '({a:null}, "a.b")', expected: 'null', isHidden: true },
    ],
hints: [
      'Split the path string by `\'.\'` to get an array of key segments: `path.split(\'.\')`.',
      'Use `reduce` to traverse the object step by step. If any segment is missing, short-circuit to `null`.',
      'Handle `null`/`undefined` safely: check `curr == null` before accessing `curr[key]`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-promise-any ───────────────────────────────────────────────────────────
  {
    id: 'cc-promise-any',
    title: 'Implement Promise.any',
    difficulty: 'mid',
    topic: 'Async',
    tags: ['promises', 'async'],
    description: `## Implement Promise.any

Write a function \`solution(promises)\` that behaves like \`Promise.any\`: resolves with the value of the **first** promise that resolves. If **all** promises reject, reject with the string \`'all_rejected'\`.

**Example:**
\`\`\`js
solution([Promise.reject('a'), Promise.resolve('b'), Promise.resolve('c')])
  .then(v => v); // 'b'

solution([Promise.reject('x'), Promise.reject('y')])
  .catch(e => e); // 'all_rejected'
\`\`\``,
    starterCode: `function solution(promises) {
  // Resolve with first success; reject 'all_rejected' if all fail
}`,
    solution: `function solution(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) { reject('all_rejected'); return; }
    let rejected = 0;
    promises.forEach(p => {
      Promise.resolve(p).then(resolve).catch(() => {
        rejected++;
        if (rejected === promises.length) reject('all_rejected');
      });
    });
  });
}`,
    testCases: [
      { id: 'pany1', label: 'resolves with first fulfilled', input: '(solution([Promise.reject("a"), Promise.resolve("b"), Promise.resolve("c")]))', expected: '"b"', isHidden: false },
      { id: 'pany2', label: 'rejects when all reject', input: '(solution([Promise.reject("x"), Promise.reject("y")]).catch(e => e))', expected: '"all_rejected"', isHidden: false },
      { id: 'pany3', label: 'single resolve', input: '(solution([Promise.resolve(42)]))', expected: '42', isHidden: false },
      { id: 'pany4', label: 'empty array rejects', input: '(solution([]).catch(e => e))', expected: '"all_rejected"', isHidden: true },
      { id: 'pany5', label: 'first resolved wins race', input: '(solution([Promise.resolve(1), Promise.resolve(2)]))', expected: '1', isHidden: true },
    ],
hints: [
      'The promise resolves as soon as any input promise resolves — attach `.then(resolve)` to each.',
      'Track rejections in a counter. When all promises have rejected (`count === promises.length`), reject the outer promise.',
      'Edge case: an empty input array should reject immediately.',
    ],
        timeLimit: 5000,
  },

  // ── cc-flatten-object ────────────────────────────────────────────────────────
  {
    id: 'cc-flatten-object',
    title: 'Flatten Nested Object',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['objects', 'recursion', 'utility'],
    description: `## Flatten Nested Object

Write a function \`solution(obj)\` that flattens a nested object into a single-level object with **dot-notation keys**. Arrays are treated as leaf values — do not flatten inside arrays.

**Examples:**
\`\`\`js
solution({ a: { b: { c: 1 } } })
// { 'a.b.c': 1 }

solution({ x: 1, y: { z: 2, w: 3 } })
// { 'x': 1, 'y.z': 2, 'y.w': 3 }

solution({ arr: [1, 2] })
// { 'arr': [1, 2] }
\`\`\``,
    starterCode: `function solution(obj, prefix = '') {
  // Flatten nested object to dot-notation keys
}`,
    solution: `function solution(obj, prefix = '') {
  return Object.entries(obj).reduce((flat, [key, val]) => {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(flat, solution(val, fullKey));
    } else {
      flat[fullKey] = val;
    }
    return flat;
  }, {});
}`,
    testCases: [
      { id: 'fo1', label: 'deeply nested object', input: '({a:{b:{c:1}}})', expected: '{"a.b.c":1}', isHidden: false },
      { id: 'fo2', label: 'mixed flat and nested', input: '({x:1,y:{z:2,w:3}})', expected: '{"x":1,"y.z":2,"y.w":3}', isHidden: false },
      { id: 'fo3', label: 'array treated as leaf', input: '({arr:[1,2]})', expected: '{"arr":[1,2]}', isHidden: false },
      { id: 'fo4', label: 'already flat', input: '({a:1,b:2})', expected: '{"a":1,"b":2}', isHidden: true },
      { id: 'fo5', label: 'null value preserved', input: '({a:{b:null}})', expected: '{"a.b":null}', isHidden: true },
    ],
hints: [
      'Use `Object.entries` to get key-value pairs, then `reduce` to build the flattened result.',
      'For each value that is a non-null, non-array object, recurse with the current `prefix.key` as the new prefix.',
      'Arrays are leaf values — don\'t recurse into them. Use `Array.isArray(val)` to detect arrays.',
    ],
        timeLimit: 5000,
  },

  // ── cc-async-pool ────────────────────────────────────────────────────────────
  {
    id: 'cc-async-pool',
    title: 'Async Task Pool (Concurrency Limit)',
    difficulty: 'senior',
    topic: 'Async',
    tags: ['async', 'promises', 'concurrency', 'performance'],
    description: `## Async Task Pool

Write a function \`solution(tasks, limit)\` that runs an array of async task functions with at most \`limit\` running concurrently. Returns a Promise resolving to an array of results **in the same order as tasks**.

**Example:**
\`\`\`js
const tasks = [
  () => Promise.resolve(1),
  () => Promise.resolve(2),
  () => Promise.resolve(3),
];
solution(tasks, 2).then(r => r); // [1, 2, 3]
\`\`\`

This is a common pattern used in batching API calls, image processing pipelines, and CI job runners.`,
    starterCode: `async function solution(tasks, limit) {
  // Run tasks with at most 'limit' concurrent executions
  // Return results in task order
}`,
    solution: `async function solution(tasks, limit) {
  const results = new Array(tasks.length);
  const pool = new Set();
  for (let i = 0; i < tasks.length; i++) {
    const idx = i;
    const p = Promise.resolve().then(() => tasks[idx]()).then(r => {
      results[idx] = r;
      pool.delete(p);
    });
    pool.add(p);
    if (pool.size >= limit) await Promise.race(pool);
  }
  await Promise.all(pool);
  return results;
}`,
    testCases: [
      { id: 'ap1', label: 'returns results in order', input: '(solution([() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)], 2))', expected: '[1,2,3]', isHidden: false },
      { id: 'ap2', label: 'limit of 1 (sequential)', input: '(solution([() => Promise.resolve("a"), () => Promise.resolve("b")], 1))', expected: '["a","b"]', isHidden: false },
      { id: 'ap3', label: 'limit >= tasks runs all at once', input: '(solution([() => Promise.resolve(10), () => Promise.resolve(20)], 5))', expected: '[10,20]', isHidden: false },
      { id: 'ap4', label: 'single task', input: '(solution([() => Promise.resolve(42)], 2))', expected: '[42]', isHidden: true },
      { id: 'ap5', label: 'empty tasks array', input: '(solution([], 2))', expected: '[]', isHidden: true },
    ],
hints: [
      'Keep a `Set` of in-flight Promises. When the set reaches `limit`, `await Promise.race(pool)` to wait for one to finish.',
      'Track results by index (not by order of completion) so the output order matches the input order.',
      'After the loop, `await Promise.all(pool)` to wait for any remaining in-flight tasks.',
    ],
        timeLimit: 8000,
  },

  // ── cc-linked-list ───────────────────────────────────────────────────────────
  {
    id: 'cc-linked-list',
    title: 'Singly Linked List',
    difficulty: 'mid',
    topic: 'JavaScript',
    tags: ['data structures', 'linked list', 'classes'],
    description: `## Singly Linked List

Write a function \`solution()\` that returns a singly linked list object with these methods:

- \`append(val)\` — add \`val\` to the **end**
- \`prepend(val)\` — add \`val\` to the **beginning**
- \`delete(val)\` — remove the first node with that value
- \`toArray()\` — return all values as an array (head → tail)

**Example:**
\`\`\`js
const list = solution();
list.append(1);
list.append(2);
list.prepend(0);
list.toArray(); // [0, 1, 2]
list.delete(1);
list.toArray(); // [0, 2]
\`\`\``,
    starterCode: `function solution() {
  // Return an object with append, prepend, delete, toArray
}`,
    solution: `function solution() {
  let head = null;
  return {
    append(val) {
      const node = { val, next: null };
      if (!head) { head = node; return; }
      let curr = head;
      while (curr.next) curr = curr.next;
      curr.next = node;
    },
    prepend(val) {
      head = { val, next: head };
    },
    delete(val) {
      if (!head) return;
      if (head.val === val) { head = head.next; return; }
      let curr = head;
      while (curr.next && curr.next.val !== val) curr = curr.next;
      if (curr.next) curr.next = curr.next.next;
    },
    toArray() {
      const result = [];
      let curr = head;
      while (curr) { result.push(curr.val); curr = curr.next; }
      return result;
    },
  };
}`,
    testCases: [
      { id: 'll1', label: 'append builds list in order', input: '(() => { const l = solution(); l.append(1); l.append(2); l.append(3); return l.toArray(); })()', expected: '[1,2,3]', isHidden: false },
      { id: 'll2', label: 'prepend adds to front', input: '(() => { const l = solution(); l.append(2); l.prepend(1); l.prepend(0); return l.toArray(); })()', expected: '[0,1,2]', isHidden: false },
      { id: 'll3', label: 'delete removes value', input: '(() => { const l = solution(); l.append(1); l.append(2); l.append(3); l.delete(2); return l.toArray(); })()', expected: '[1,3]', isHidden: false },
      { id: 'll4', label: 'delete head', input: '(() => { const l = solution(); l.append(1); l.append(2); l.delete(1); return l.toArray(); })()', expected: '[2]', isHidden: true },
      { id: 'll5', label: 'empty list toArray', input: '(() => { const l = solution(); return l.toArray(); })()', expected: '[]', isHidden: true },
    ],
hints: [
      'Each node is a plain object `{ val, next }`. The list tracks a `head` pointer in a closure.',
      '`append` must traverse to the last node (where `next === null`) before adding the new node.',
      '`delete` requires tracking the previous node. Special-case deleting the head node since there\'s no previous.',
    ],
        timeLimit: 5000,
  },

  // ── cc-mini-redux ────────────────────────────────────────────────────────────
  {
    id: 'cc-mini-redux',
    title: 'Implement Mini Redux (createStore)',
    difficulty: 'senior',
    topic: 'JavaScript',
    tags: ['patterns', 'state management', 'React'],
    description: `## Implement Mini Redux

Write a function \`solution(reducer, initialState)\` that returns a Redux-style store with:

- \`getState()\` — returns the current state
- \`dispatch(action)\` — runs \`reducer(state, action)\` and updates state; notifies subscribers
- \`subscribe(listener)\` — registers a listener called after every dispatch; returns an unsubscribe function

**Example:**
\`\`\`js
const reducer = (state = 0, action) => {
  if (action.type === 'INC') return state + 1;
  return state;
};
const store = solution(reducer, 0);
store.getState(); // 0
store.dispatch({ type: 'INC' });
store.getState(); // 1
\`\`\``,
    starterCode: `function solution(reducer, initialState) {
  // Return { getState, dispatch, subscribe }
}`,
    solution: `function solution(reducer, initialState) {
  let state = initialState;
  const listeners = [];
  return {
    getState() { return state; },
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach(l => l());
      return action;
    },
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
}`,
    testCases: [
      { id: 'rx1', label: 'getState returns initial state', input: '(solution((s = 0) => s, 42).getState())', expected: '42', isHidden: false },
      { id: 'rx2', label: 'dispatch updates state', input: '(() => { const store = solution((s = 0, a) => a.type === "INC" ? s + 1 : s, 0); store.dispatch({type:"INC"}); store.dispatch({type:"INC"}); return store.getState(); })()', expected: '2', isHidden: false },
      { id: 'rx3', label: 'subscribe listener called on dispatch', input: '(() => { let calls = 0; const store = solution((s = 0) => s, 0); store.subscribe(() => calls++); store.dispatch({}); store.dispatch({}); return calls; })()', expected: '2', isHidden: false },
      { id: 'rx4', label: 'unsubscribe stops listener', input: '(() => { let calls = 0; const store = solution((s = 0) => s, 0); const unsub = store.subscribe(() => calls++); store.dispatch({}); unsub(); store.dispatch({}); return calls; })()', expected: '1', isHidden: true },
      { id: 'rx5', label: 'reducer receives current state', input: '(() => { const store = solution((s, a) => a.type === "SET" ? a.payload : s, 10); store.dispatch({type:"SET",payload:99}); return store.getState(); })()', expected: '99', isHidden: true },
    ],
hints: [
      'Store state in a closure variable. `getState` returns it, `dispatch` updates it by calling `reducer(state, action)`.',
      'Maintain an array of `listeners`. Call each one after every `dispatch`. `subscribe` adds to the array and returns an unsubscribe function.',
      'The unsubscribe function should remove the listener from the array: `listeners.splice(listeners.indexOf(listener), 1)`.',
    ],
        timeLimit: 5000,
  },

  // ── cc-finite-state-machine ──────────────────────────────────────────────────
  {
    id: 'cc-finite-state-machine',
    title: 'Finite State Machine',
    difficulty: 'senior',
    topic: 'JavaScript',
    tags: ['patterns', 'state management', 'React'],
    description: `## Finite State Machine

Write a function \`solution(config)\` that creates a simple finite state machine (FSM). \`config\` has the shape:

\`\`\`js
{
  initial: 'idle',
  states: {
    idle:    { on: { FETCH: 'loading' } },
    loading: { on: { SUCCESS: 'done', ERROR: 'idle' } },
    done:    { on: {} },
  }
}
\`\`\`

Return an object with:
- \`getState()\` — returns the current state name
- \`send(event)\` — transitions to the next state (if defined), returns the new state name

If no transition is defined for the current state + event, stay in the current state.

**Example:**
\`\`\`js
const fsm = solution(config);
fsm.getState();      // 'idle'
fsm.send('FETCH');   // 'loading'
fsm.send('SUCCESS'); // 'done'
fsm.send('FETCH');   // 'done'  (no transition defined)
\`\`\``,
    starterCode: `function solution(config) {
  // Return { getState, send }
}`,
    solution: `function solution(config) {
  let current = config.initial;
  return {
    getState() { return current; },
    send(event) {
      const next = config.states[current]?.on?.[event];
      if (next) current = next;
      return current;
    },
  };
}`,
    testCases: [
      { id: 'fsm1', label: 'returns initial state', input: '(solution({initial:"idle",states:{idle:{on:{}}}}).getState())', expected: '"idle"', isHidden: false },
      { id: 'fsm2', label: 'transitions on valid event', input: '(() => { const m = solution({initial:"idle",states:{idle:{on:{FETCH:"loading"}},loading:{on:{}}}}); m.send("FETCH"); return m.getState(); })()', expected: '"loading"', isHidden: false },
      { id: 'fsm3', label: 'stays on invalid event', input: '(() => { const m = solution({initial:"idle",states:{idle:{on:{}}}}); m.send("UNKNOWN"); return m.getState(); })()', expected: '"idle"', isHidden: false },
      { id: 'fsm4', label: 'multi-step transitions', input: '(() => { const m = solution({initial:"a",states:{a:{on:{GO:"b"}},b:{on:{GO:"c"}},c:{on:{}}}}); m.send("GO"); m.send("GO"); return m.getState(); })()', expected: '"c"', isHidden: true },
      { id: 'fsm5', label: 'send returns new state', input: '(solution({initial:"off",states:{off:{on:{TOGGLE:"on"}},on:{on:{TOGGLE:"off"}}}}).send("TOGGLE"))', expected: '"on"', isHidden: true },
    ],
hints: [
      'Store the current state name as a string. Use the config to look up valid transitions.',
      '`send(event)` looks up `config.states[currentState].on[event]`. If a next state is defined, update current state.',
      'If no transition is defined for the current state + event, stay in the current state (no mutation).',
    ],
        timeLimit: 5000,
  },
];

async function main() {
  console.log(`Seeding ${challenges.length} coding challenges…`);
  let created = 0;
  let skipped = 0;

  for (const ch of challenges) {
    const exists = await prisma.codingChallenge.findUnique({ where: { id: ch.id }, select: { id: true } });
    if (exists) {
      await prisma.codingChallenge.update({
        where: { id: ch.id },
        data: {
          title: ch.title,
          description: ch.description,
          difficulty: ch.difficulty,
          topic: ch.topic,
          tags: ch.tags,
          starterCode: ch.starterCode,
          testCases: ch.testCases as never,
          hints: ch.hints as never,
          solution: ch.solution,
          timeLimit: ch.timeLimit,
        },
      });
      skipped++;
    } else {
      await prisma.codingChallenge.create({
        data: {
          id: ch.id,
          title: ch.title,
          description: ch.description,
          difficulty: ch.difficulty,
          topic: ch.topic,
          tags: ch.tags,
          starterCode: ch.starterCode,
          testCases: ch.testCases as never,
          hints: ch.hints as never,
          solution: ch.solution,
          timeLimit: ch.timeLimit,
        },
      });
      created++;
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${skipped}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
