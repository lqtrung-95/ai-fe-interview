import type { Metadata } from 'next';
import { HandbookCheatsheetPage } from '@/features/resources/components/handbook-cheatsheet-page';

export const metadata: Metadata = {
  title: 'React Deep Dive Cheatsheet',
  description: 'Condensed cheatsheet of the React Deep Dive handbook — key takeaways, decision tables, and recall cards.',
};

export default function Page() {
  return (
    <HandbookCheatsheetPage
      dataFile="react-deep-dive.json"
      backHref="/resources/react-deep-dive"
      backLabel="React Deep Dive"
    />
  );
}
