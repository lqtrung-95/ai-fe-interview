'use client';

import { useLinkStatus } from 'next/link';

/**
 * Fixed-size pending dot rendered inside nav <Link>s (sidebar + mobile menu).
 * Lights up while the navigation for its parent Link is in flight, giving
 * instant click feedback on slow transitions. Always rendered at a fixed
 * size to avoid layout shift; the 100ms animation delay in
 * `.app-nav-pending` keeps it invisible on fast navigations.
 */
export function NavLinkPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={'app-nav-pending ml-auto h-1.5 w-1.5 shrink-0 rounded-full' + (pending ? ' is-pending' : '')}
    />
  );
}
