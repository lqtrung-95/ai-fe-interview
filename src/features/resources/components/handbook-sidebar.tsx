'use client';

/**
 * Sticky left navigation for the handbook detail page.
 * Scroll-spies on section[id] elements via IntersectionObserver and highlights
 * the currently visible section link. Hidden on mobile (< md).
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/data/resources/handbook-types';

interface Props {
  nav: NavItem[];
}

export function HandbookSidebar({ nav }: Props) {
  const [activeId, setActiveId] = useState<string>(nav[0]?.id ?? '');
  // Locked while a click-triggered smooth scroll is in flight — prevents the
  // IntersectionObserver from stepping through every intermediate section.
  const scrollLockRef = useRef(false);

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockRef.current) return; // ignore while programmatic scroll plays out
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Group nav items by their group label
  const groups: { label: string | undefined; items: NavItem[] }[] = [];
  for (const item of nav) {
    const last = groups[groups.length - 1];
    if (!last || last.label !== item.group) {
      groups.push({ label: item.group, items: [item] });
    } else {
      last.items.push(item);
    }
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col sticky top-0 h-screen border-r border-border/40 bg-background/98 backdrop-blur-sm">
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-2 mb-4">
          <span className="h-px flex-1 bg-border/40" />
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            Contents
          </p>
          <span className="h-px flex-1 bg-border/40" />
        </div>

        <nav className="space-y-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <li key={item.id} className="relative">
                      {/* Active left-edge indicator */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                      )}
                      <a
                        href={`#${item.id}`}
                        className={cn(
                          'block rounded-md pl-4 pr-3 py-1.5 text-[11px] leading-snug transition-colors duration-100 cursor-pointer',
                          active
                            ? 'text-primary font-semibold bg-primary/10'
                            : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50',
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          // Jump active state immediately — no stepping through intermediates
                          setActiveId(item.id);
                          // Lock observer for the duration of the smooth scroll (~800ms)
                          scrollLockRef.current = true;
                          document.getElementById(item.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                          setTimeout(() => { scrollLockRef.current = false; }, 900);
                        }}
                      >
                        {item.label.replace(/\*\*/g, '')}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom fade — indicates more content below */}
      <div className="pointer-events-none h-12 bg-gradient-to-t from-background to-transparent" />
    </aside>
  );
}
