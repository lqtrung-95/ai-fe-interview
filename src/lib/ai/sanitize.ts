import 'server-only';

/**
 * Strips common prompt-injection patterns from user-supplied text and caps
 * length before it enters a prompt. Defensive — won't catch sophisticated
 * jailbreaks but blunts the easy ones.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (?:all )?(?:previous|prior|above) (?:instructions?|prompts?|messages?)/gi,
  /disregard (?:all )?(?:previous|prior|above)/gi,
  /you are now (?:a different|now|actually)/gi,
  /<\|?(?:im_start|im_end|system|user|assistant)\|?>/gi,
  /\[\[?(?:system|assistant|tool)\]?\]/gi,
];

const DEFAULT_MAX_CHARS = 4000;

export function sanitize(text: string, maxChars: number = DEFAULT_MAX_CHARS): string {
  let out = text;
  for (const pat of INJECTION_PATTERNS) {
    out = out.replace(pat, '[redacted]');
  }
  out = out.trim();
  if (out.length > maxChars) {
    out = out.slice(0, maxChars) + '…';
  }
  return out;
}
