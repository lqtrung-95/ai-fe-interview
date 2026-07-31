/**
 * Topic ↔ URL-slug map for the public per-topic hub pages
 * (/questions/react, /questions/javascript, …). These share the
 * /questions/[slug] segment with question detail pages — question slugs are
 * derived from question text ("how-…", "tell-me-…") so they can't collide,
 * and the backfill-era check confirmed zero overlaps.
 *
 * `intro` is hand-written unique copy: these pages target head terms
 * ("react interview questions") and need static prose beyond the link list.
 */

export interface QuestionTopicPage {
  topic: string; // canonical topic value in SeedQuestion.topic
  slug: string;
  title: string; // h1 / metadata title base
  intro: string;
}

export const QUESTION_TOPIC_PAGES: QuestionTopicPage[] = [
  {
    topic: 'JavaScript',
    slug: 'javascript',
    title: 'JavaScript Interview Questions',
    intro:
      'Senior-level JavaScript questions covering the engine internals interviewers actually probe: the event loop and microtasks, closures and memory retention, prototypes, iterators and generators, ESM internals, garbage collection, and async patterns. Each question includes a plain-English explanation and an architecture diagram.',
  },
  {
    topic: 'React',
    slug: 'react',
    title: 'React Interview Questions',
    intro:
      'React questions from reconciliation and Fiber internals to hooks, Suspense, concurrent rendering, Server Components, and the React 19 compiler era. Includes the trade-off and debugging scenarios senior interviews lean on, each with an ELI5 explanation and diagram.',
  },
  {
    topic: 'Frontend System Design',
    slug: 'frontend-system-design',
    title: 'Frontend System Design Interview Questions',
    intro:
      'Design-round questions for frontend engineers: news feeds, autocomplete, real-time collaboration, design systems, feature flags, A/B infrastructure, offline-first sync, and more — structured around requirements, data flow, and the trade-offs interviewers want articulated.',
  },
  {
    topic: 'Web Performance',
    slug: 'web-performance',
    title: 'Web Performance Interview Questions',
    intro:
      'Performance questions spanning Core Web Vitals, rendering pipelines, virtual scrolling, bundle strategy, caching layers, and measurement-first debugging — the staff-level material that separates "make it fast" answers from real engineering.',
  },
  {
    topic: 'Browser & Web APIs',
    slug: 'browser-and-web-apis',
    title: 'Browser & Web API Interview Questions',
    intro:
      'How browsers actually work: the render pipeline, storage options, service workers, Web Workers, CSP and security headers, Intersection Observer, Shadow DOM, and the platform APIs that come up in senior frontend interviews.',
  },
  {
    topic: 'Testing',
    slug: 'testing',
    title: 'Frontend Testing Interview Questions',
    intro:
      'Testing strategy questions for frontend roles: unit vs integration vs E2E trade-offs, testing React components and hooks, mocking boundaries, flaky test diagnosis, and how senior engineers reason about coverage versus confidence.',
  },
  {
    topic: 'Behavioral',
    slug: 'behavioral',
    title: 'Behavioral Interview Questions for Engineers',
    intro:
      'Behavioral questions tailored to software engineers — failure stories, production incidents, cross-team conflict, estimation misses, and influence without authority — each with STAR answer structure, strong-vs-weak answer guidance, and the probing follow-ups interviewers use.',
  },
  {
    topic: 'Web3 & Blockchain',
    slug: 'web3-blockchain',
    title: 'Web3 & Blockchain Frontend Interview Questions',
    intro:
      'Frontend-focused web3 questions covering wallet connection (EIP-1193 and window.ethereum), reading and writing contract state with viem and wagmi, the transaction lifecycle and pending-state UX, EIP-712 typed-data signing, wei and BigInt precision, event syncing, chain switching, RPC provider strategy, approval security, ENS, and dapp testing — the material that separates real dapp engineers from tutorial-followers.',
  },
];

export function getTopicPageBySlug(slug: string): QuestionTopicPage | undefined {
  return QUESTION_TOPIC_PAGES.find((t) => t.slug === slug);
}

export function getTopicPageByTopic(topic: string): QuestionTopicPage | undefined {
  return QUESTION_TOPIC_PAGES.find((t) => t.topic === topic);
}
