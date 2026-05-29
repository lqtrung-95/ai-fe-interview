import { QueryClient } from '@tanstack/react-query';

/**
 * Factory — call once per client mount (never at module scope).
 * Module-scope singletons share state across SSR requests and cause cache bleed.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 60 s — prevents unnecessary refetch on tab refocus
        staleTime: 60 * 1000,
        // Keep unused cache entries for 5 min before GC
        gcTime: 5 * 60 * 1000,
        // Skip retrying 4xx client errors; retry server errors up to 2×
        retry: (failureCount, error: unknown) => {
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        // Surface errors in mutation state; don't propagate to ErrorBoundary
        throwOnError: false,
      },
    },
  });
}
