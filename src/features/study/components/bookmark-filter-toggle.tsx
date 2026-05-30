'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Props {
  active: boolean;
}

/**
 * Toggle button that adds/removes ?bookmarked=true from the URL.
 * Preserves existing search params (topic, difficulty, type).
 */
export function BookmarkFilterToggle({ active }: Props) {
  const searchParams = useSearchParams();

  function buildHref() {
    const params = new URLSearchParams(searchParams.toString());
    if (active) {
      params.delete('bookmarked');
    } else {
      params.set('bookmarked', 'true');
    }
    const qs = params.toString();
    return `/question-bank${qs ? `?${qs}` : ''}`;
  }

  return (
    <Link
      href={buildHref()}
      aria-label={active ? 'Show all questions' : 'Show bookmarked only'}
      className={
        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ' +
        (active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/70 bg-card text-muted-foreground hover:border-primary/50 hover:text-primary')
      }
    >
      <Bookmark className={`h-3.5 w-3.5 ${active ? 'fill-current' : ''}`} />
      Bookmarked
    </Link>
  );
}
