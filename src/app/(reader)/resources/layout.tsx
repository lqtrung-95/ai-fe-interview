import { ResourceSearchLauncher } from '@/features/resources/search/resource-search-launcher';

/**
 * Scopes the cross-resource ⌘K search to /resources/* only — the question
 * pages share the reader layout but are not part of the handbook index.
 */
export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ResourceSearchLauncher />
    </>
  );
}
