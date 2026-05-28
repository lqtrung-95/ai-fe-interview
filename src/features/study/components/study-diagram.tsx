/**
 * Renders the raw SVG string extracted from the source HTML diagrams.
 * The SVGs are authored by us (not user input), so dangerouslySetInnerHTML is safe.
 * We wrap in a scrollable container so wide diagrams don't break layout.
 */

interface Props {
  svgHtml: string;
}

export function StudyDiagram({ svgHtml }: Props) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
        Diagram
      </p>
      <div
        className="overflow-x-auto [&_svg]:h-auto [&_svg]:max-h-80 [&_svg]:w-full"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </div>
  );
}
