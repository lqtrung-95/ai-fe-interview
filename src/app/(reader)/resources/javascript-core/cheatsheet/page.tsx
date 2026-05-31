import type { Metadata } from 'next';
import { HandbookCheatsheetPage } from '@/features/resources/components/handbook-cheatsheet-page';

export const metadata: Metadata = {
  title: 'JavaScript Core Cheatsheet',
  description: 'Condensed cheatsheet of the JavaScript Core handbook — key takeaways, decision tables, and recall cards.',
};

export default function Page() {
  return (
    <HandbookCheatsheetPage
      dataFile="javascript-core.json"
      backHref="/resources/javascript-core"
      backLabel="JavaScript Core"
    />
  );
}
