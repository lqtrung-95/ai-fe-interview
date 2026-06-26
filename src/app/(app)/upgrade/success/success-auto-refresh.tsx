'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Silently calls router.refresh() after a short delay so the app layout
 * re-fetches the user's isPro status once the Polar webhook has fired.
 */
export function SuccessAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Webhook usually arrives within 1-2 seconds of checkout completion.
    // Refresh at 3 s and again at 8 s to cover any delay.
    const t1 = setTimeout(() => router.refresh(), 3000);
    const t2 = setTimeout(() => router.refresh(), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  return null;
}
