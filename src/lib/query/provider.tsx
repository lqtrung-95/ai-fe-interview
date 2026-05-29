'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { makeQueryClient } from './client';

/**
 * Wraps the entire app with the TanStack Query context.
 * Must be 'use client' — QueryClientProvider requires a client boundary.
 * DevTools are tree-shaken out of production builds by Next.js.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures a fresh QueryClient per mount, never shared across SSR requests
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
