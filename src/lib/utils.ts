import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Converts inline markdown to safe HTML for rendering via dangerouslySetInnerHTML.
 * Only used with LLM/script-generated content — never user input.
 *   `code`   → <code>code</code>  (content HTML-escaped to prevent tag injection)
 *   **bold** → <strong>bold</strong>
 */
export function mdToHtml(text: string): string {
  return text
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
