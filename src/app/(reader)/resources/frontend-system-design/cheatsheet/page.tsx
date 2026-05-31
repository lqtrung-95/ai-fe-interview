import type { Metadata } from 'next';
import { HandbookCheatsheetPage } from '@/features/resources/components/handbook-cheatsheet-page';

export const metadata: Metadata = {
  title: 'Frontend System Design Cheatsheet',
  description: 'Condensed cheatsheet of the Frontend System Design handbook — key takeaways, decision tables, and recall cards.',
};

export default function Page() {
  return (
    <HandbookCheatsheetPage
      dataFile="frontend-system-design.json"
      backHref="/resources/frontend-system-design"
      backLabel="Frontend System Design"
    />
  );
}
