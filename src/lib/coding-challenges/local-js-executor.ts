import 'server-only';
import { runInNewContext } from 'vm';

export type LocalExecResult = {
  run: { stdout: string; stderr: string; code: number };
};

/**
 * Executes the test harness in a Node.js vm context.
 * Strips dangerous Node/IO globals; re-enables timers so async solutions work.
 * The harness is an async IIFE — we await the returned Promise with a wall-clock timeout.
 */
export async function executeJs(code: string, timeoutMs: number): Promise<LocalExecResult> {
  let captured = '';

  const safeGlobals = {
    // Standard JS globals — no require, process, fetch, fs, etc.
    JSON, Math, Date, parseInt, parseFloat, Number, String, Boolean,
    Array, Object, Map, Set, WeakMap, WeakSet, Promise, Symbol, BigInt,
    RegExp, Error, TypeError, RangeError, SyntaxError, AggregateError,
    // Timers are needed for debounce/throttle/retry async tests
    setTimeout, clearTimeout, setInterval, clearInterval,
    Infinity, NaN, undefined, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent,
    console: {
      log: (...args: unknown[]) => {
        captured += args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
      },
      error: () => {},
      warn: () => {},
    },
  };

  try {
    const result = runInNewContext(code, safeGlobals, {
      timeout: timeoutMs,
      filename: 'solution.js',
    });

    // Harness is an async IIFE — await with a wall-clock deadline
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      await Promise.race([
        result as Promise<unknown>,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Time limit exceeded')), timeoutMs + 2000)
        ),
      ]);
    }

    return { run: { stdout: captured, stderr: '', code: 0 } };
  } catch (e) {
    const err = e as Error;
    const isTimeout =
      err.message?.includes('timed out') ||
      err.message?.includes('Script execution timed out') ||
      err.message === 'Time limit exceeded';
    return {
      run: {
        stdout: captured,
        stderr: isTimeout ? 'Time limit exceeded' : (err.message ?? String(e)),
        code: 1,
      },
    };
  }
}
