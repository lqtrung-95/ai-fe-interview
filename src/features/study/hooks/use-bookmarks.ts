'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'qb_bookmarks_v1';

function readIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * localStorage-backed bookmark store for question bank cards.
 * Initialises on mount so SSR always returns an empty set (no hydration
 * mismatch), then syncs with localStorage once the component is client-side.
 */
export function useBookmarks() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIds(readIds());
  }, []);

  const toggle = useCallback((questionId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Storage quota exceeded — silently ignore
      }
      return next;
    });
  }, []);

  return { ids, toggle };
}
