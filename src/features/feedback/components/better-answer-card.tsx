'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  answer: string;
}

// Terms to auto-highlight in older answers that predate the backtick-prompt change.
// New answers use backticks which are handled above; this is the fallback.
const HIGHLIGHT_TERMS = [
  // React hooks & APIs
  'useState','useEffect','useReducer','useContext','useRef','useCallback','useMemo',
  'useLayoutEffect','useInsertionEffect','useId','useTransition','useDeferredValue',
  'useSyncExternalStore','useImperativeHandle','useDebugValue','useSuspenseQuery',
  'React\\.memo','React\\.lazy','React\\.createContext','React\\.forwardRef',
  'startTransition','createContext','forwardRef','Suspense','ErrorBoundary',
  // React concepts
  'React Server Components','Client Components','Server Components','RSC',
  'virtual DOM','reconciliation','hydration','concurrent mode','concurrent rendering',
  'fiber','key prop','render phase','commit phase','batching','Strict Mode',
  // State management
  'Zustand','Redux','Recoil','Jotai','Context API','useStore','useSelector',
  // Data fetching
  'React Query','TanStack Query','SWR','useSuspenseQuery','useQuery','useMutation',
  'useInfiniteQuery','staleTime','gcTime','invalidateQueries','prefetchQuery',
  // Performance
  'INP','LCP','CLS','FCP','TTFB','TBT','TTI','Core Web Vitals','Lighthouse',
  'React Profiler','Performance panel','commit durations','wasted renders',
  'React render time','JavaScript execution','layout thrash','main-thread blocking',
  'third-party script','long-task trace','long tasks','long task',
  'code splitting','lazy loading','tree shaking','bundle splitting',
  'requestAnimationFrame','requestIdleCallback','web vitals',
  'virtualization','windowing','react-window','react-virtual',
  'memoization','Memoization',
  // GraphQL / Apollo
  'Apollo Client','Apollo Server','ApolloProvider','InMemoryCache',
  'useSubscription','WebSocketLink','connectionParams','RetryLink',
  'pollInterval','fetchPolicy','cache-first','network-only','no-cache',
  'gql','GraphQL','subscriptions','mutations','queries',
  // Browser APIs
  'IntersectionObserver','MutationObserver','ResizeObserver','PerformanceObserver',
  'Service Worker','Web Worker','SharedArrayBuffer','BroadcastChannel',
  'IndexedDB','localStorage','sessionStorage','Cache API',
  'WebSocket','WebRTC','EventSource','Server-Sent Events',
  'requestAnimationFrame','CustomEvent','addEventListener','AbortController',
  // JavaScript
  'Promise','async/await','event loop','microtask','macrotask',
  'closure','prototype chain','prototype','hoisting','temporal dead zone',
  'WeakMap','WeakSet','WeakRef','FinalizationRegistry','Symbol','Proxy','Reflect',
  'generator','iterator','for\\.\\.\\.of','destructuring','optional chaining',
  'nullish coalescing','dynamic import','import\\.meta',
  // CSS / Styling
  'CSS variables','custom properties','CSS-in-JS','Tailwind','CSS Modules',
  'flexbox','CSS Grid','media queries','container queries','cascade layers',
  'specificity','transform','will-change','content-visibility',
  // Next.js
  'App Router','Pages Router','getServerSideProps','getStaticProps',
  'getStaticPaths','Server Actions','Route Handlers','Middleware',
  'next/dynamic','next/image','next/link','ISR','SSR','SSG','PPR',
  'unstable_cache','revalidateTag','revalidatePath',
  // Testing
  'react-testing-library','@testing-library','userEvent','fireEvent',
  'jest','vitest','Playwright','Cypress','MSW','mock service worker',
  'unit test','integration test','end-to-end','snapshot test',
  // Build tools
  'webpack','Vite','Rollup','esbuild','Turbopack','SWC','Babel',
  'tree-shaking','dead code elimination','code splitting',
  // General patterns
  'higher-order component','HOC','render prop','compound component',
  'controlled component','uncontrolled component',
  'optimistic update','pessimistic update',
  'debounce','throttle','rate limiting',
].join('|');

const HIGHLIGHT_BOUNDARY = '[A-Za-z0-9_]';
const HIGHLIGHT_PATTERN = new RegExp(`(?<!${HIGHLIGHT_BOUNDARY})(${HIGHLIGHT_TERMS})(?!${HIGHLIGHT_BOUNDARY})`, 'gi');
const HIGHLIGHT_TEST_PATTERN = new RegExp(`^(${HIGHLIGHT_TERMS})$`, 'i');

export function BetterAnswerCard({ answer }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in non-HTTPS or restrictive contexts; no-op.
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-border/70 bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Better answer</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAnswer}
          aria-label={copied ? 'Copied to clipboard' : 'Copy better answer'}
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              <span className="ml-1.5 text-xs">Copied</span>
            </>
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
      <div className="space-y-3 text-sm leading-7 text-foreground/80">
        {answer.split(/\n\n+/).map((para, i) => (
          <p key={i}>{renderHighlightedAnswer(para.trim())}</p>
        ))}
      </div>
    </section>
  );
}

function renderHighlightedAnswer(text: string) {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      // Backtick terms → highlighted pill (primary style going forward)
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <mark
            key={index}
            className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary dark:bg-primary/15 not-italic"
          >
            {part.slice(1, -1)}
          </mark>
        );
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }

      // Hardcoded keyword pattern — fallback for older answers without backtick formatting
      return highlightKeywords(part, index);
    });
}

function highlightKeywords(text: string, keyPrefix: number) {
  return text
    .split(HIGHLIGHT_PATTERN)
    .filter(Boolean)
    .map((part, index) =>
      HIGHLIGHT_TEST_PATTERN.test(part) ? (
        <mark
          key={`${keyPrefix}-${index}`}
          className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary dark:bg-primary/15"
        >
          {part}
        </mark>
      ) : (
        <span key={`${keyPrefix}-${index}`}>{part}</span>
      ),
    );
}
