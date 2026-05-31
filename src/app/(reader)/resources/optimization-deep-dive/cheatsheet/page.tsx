import type { Metadata } from 'next';
import { HandbookCheatsheetPage } from '@/features/resources/components/handbook-cheatsheet-page';

export const metadata: Metadata = {
  title: 'Optimization Cheatsheet',
  description: 'Condensed cheatsheet of the Optimization Deep Dive handbook — key takeaways, decision tables, and recall cards.',
};

export default function Page() {
  return (
    <HandbookCheatsheetPage
      dataFile="optimization-deep-dive.json"
      backHref="/resources/optimization-deep-dive"
      backLabel="Optimization Deep Dive"
    />
  );
}
