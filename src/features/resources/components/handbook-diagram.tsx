/**
 * Renders an SVG diagram ContentBlock from the handbook JSON.
 * Delegates sizing logic to StudyDiagram (reuses the same pattern).
 * Server component — no interactivity needed.
 */

import { StudyDiagram } from '@/features/study/components/study-diagram';

interface Props {
  svg: string;
  caption?: string;
}

export function HandbookDiagram({ svg, caption }: Props) {
  return (
    <figure className="my-6 space-y-2">
      <StudyDiagram svgHtml={svg} />
      {caption && (
        <figcaption className="text-center text-xs font-mono text-muted-foreground tracking-wide">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
