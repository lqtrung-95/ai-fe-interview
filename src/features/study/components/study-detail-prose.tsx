import { marked } from 'marked';

/**
 * Renders detailedExplanation which can be HTML, Markdown, or mixed LLM output.
 * Running through `marked` normalizes all formats before render:
 *   - Markdown:  **bold** → <strong>, ### → <h3>, lists, `code` → proper HTML
 *   - HTML:      block-level tags pass through unchanged
 *   - Mixed:     markdown inline patterns within text nodes get converted
 *
 * Content originates from our own resources (not user input), so
 * dangerouslySetInnerHTML is safe. The .study-prose class is in globals.css.
 */

interface Props {
  html: string;
}

export function StudyDetailProse({ html }: Props) {
  // marked.parse is synchronous when no async walker is configured.
  let rendered = marked.parse(html) as string;

  // Clean up fe-prep.html artifacts that survived HTML extraction:
  //   - Embedded numbers in <li>: "1Why..." → "Why..."  (HTML had numbers as text content)
  //   - "View answer" button text that got concatenated with question text
  rendered = rendered
    .replace(/(<li[^>]*>)\s*\d+\.?\s*/g, '$1')
    .replace(/\s*View answer\s*/gi, '');

  return (
    <div
      className="study-prose"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
