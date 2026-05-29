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

const MAX_W = 880; // approx content column width
const MAX_H = 480; // cap on diagram height before vertical scroll kicks in
const MIN_W = 300; // minimum readable width; below this we prefer scroll over squish

/**
 * Injects or replaces the width/height attributes on the root <svg> element so
 * the browser always gets explicit pixel dimensions. Falls back to the original
 * string unchanged if no viewBox is found.
 */
function sizeSvg(svgHtml: string): string {
  const vb = svgHtml.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) return svgHtml;

  const natW = parseFloat(vb[1]);
  const natH = parseFloat(vb[2]);
  let scale = Math.min(1, MAX_W / natW, MAX_H / natH);

  // Very tall narrow diagram: height constraint squeezes width below MIN_W.
  // Fit by width instead so the diagram is legible; container scrolls vertically.
  if (Math.round(natW * scale) < MIN_W) {
    scale = Math.min(1, MAX_W / natW);
  }

  const cssW = Math.round(natW * scale);
  const cssH = Math.round(natH * scale);

  // Replace existing width/height attrs if present, otherwise inject after <svg
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
      {/* max-h caps very tall diagrams (e.g. broken LLM specs); overflow-auto adds scroll */}
      <div
        className="flex justify-center overflow-auto max-h-[480px]"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sizeSvg(svgHtml) }}
      />
    </div>
  );
}
