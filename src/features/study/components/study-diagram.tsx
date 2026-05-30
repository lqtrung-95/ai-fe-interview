/**
 * Renders the raw SVG string extracted from the source HTML diagrams.
 * The SVGs are authored by us (not user input), so dangerouslySetInnerHTML is safe.
 *
 * Sizing strategy: parse the SVG viewBox and inject explicit width/height pixel
 * dimensions so the SVG always renders at the correct size regardless of whether
 * the original string carries width/height attrs (hand-crafted SVGs often don't).
 *
 * Fit rules:
 *   - Normal: scale = min(1, MAX_W/natW, MAX_H/natH) — fits in bounding box
 *   - Very-tall-narrow (e.g. LLM cycle bug producing 360×3964): height-first
 *     scale would crush width below MIN_W. Switch to width-first scaling and let
 *     the container handle vertical overflow via max-h + scroll.
 */

const MAX_W = 860; // approx content column width at max-w-5xl

/**
 * Scales the SVG to fit within the column width while preserving aspect ratio.
 * Height is NOT capped here — the container's max-h + overflow-y handles tall
 * diagrams so text at the bottom is never clipped by a forced height limit.
 *
 * Falls back to the original string unchanged if no viewBox is found.
 */
function sizeSvg(svgHtml: string): string {
  const vb = svgHtml.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) return svgHtml;

  const natW = parseFloat(vb[1]);
  const natH = parseFloat(vb[2]);

  // Scale down only if wider than column; never upscale.
  const scale = Math.min(1, MAX_W / natW);
  const cssW = Math.round(natW * scale);
  const cssH = Math.round(natH * scale);

  const hasW = /(<svg\b[^>]*)\swidth="[\d.]+"/.test(svgHtml);
  if (hasW) {
    return svgHtml
      .replace(/(\swidth=")([\d.]+)"/, `$1${cssW}"`)
      .replace(/(\sheight=")([\d.]+)"/, `$1${cssH}"`);
  }
  return svgHtml.replace(/(<svg\b)/, `$1 width="${cssW}" height="${cssH}"`);
}

interface Props {
  svgHtml: string;
}

export function StudyDiagram({ svgHtml }: Props) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
      {/*
        - w-full so the SVG can use all available width
        - overflow-x-auto scrolls horizontally if SVG is wider than column
        - max-h + overflow-y-auto caps very tall diagrams
        - [&_svg]:max-w-full makes the injected SVG responsive
        - [&_svg]:h-auto lets height scale proportionally
      */}
      <div
        className="w-full overflow-x-auto overflow-y-auto max-h-[520px] [&_svg]:max-w-full [&_svg]:h-auto"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sizeSvg(svgHtml) }}
      />
    </div>
  );
}
