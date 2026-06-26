/**
 * Tab-indent support for plain controlled <textarea>s. Lets candidates sketch
 * code snippets in answers without Tab stealing focus. Inserts two spaces at
 * the cursor (or replaces the selection) and reports the cursor position to
 * restore after React re-renders the controlled value.
 */

const INDENT = '  '; // two spaces

export interface IndentResult {
  value: string;
  cursor: number;
}

/** Compute the new textarea value + cursor after a Tab press. */
export function applyTabIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): IndentResult {
  const next = value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd);
  return { value: next, cursor: selectionStart + INDENT.length };
}
