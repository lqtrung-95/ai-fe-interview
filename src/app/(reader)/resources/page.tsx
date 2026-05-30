import { redirect } from 'next/navigation';

/**
 * /resources → redirect to the only handbook for now.
 * When more handbooks are added, replace with an index listing page.
 */
export default function ResourcesIndexPage() {
  redirect('/resources/frontend-system-design');
}
