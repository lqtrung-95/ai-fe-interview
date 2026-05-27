/**
 * Sentinel error thrown by client fetch helpers when the server returns 429.
 * UI code uses `error instanceof RateLimitError` to render a cooldown banner
 * instead of the generic error message.
 */
export class RateLimitError extends Error {
  readonly retryAfter: number; // seconds

  constructor(retryAfter: number) {
    super(`Rate limited — try again in ${retryAfter}s.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Inspect a fetch Response and, if it's a 429, throw a RateLimitError carrying
 * retry-after seconds. Otherwise throws a regular Error with the best-available
 * message. Call this immediately after a failed `response.ok` check.
 */
export async function throwForFailedResponse(response: Response): Promise<never> {
  if (response.status === 429) {
    let retryAfter = Number(response.headers.get('retry-after') ?? 0);
    if (!Number.isFinite(retryAfter) || retryAfter <= 0) {
      const body = await response.clone().json().catch(() => ({}));
      retryAfter = Number(body.retryAfter ?? 30);
    }
    throw new RateLimitError(Math.max(1, Math.round(retryAfter)));
  }
  const body = await response.json().catch(() => ({}));
  throw new Error(body.message ?? body.error ?? `HTTP ${response.status}`);
}
