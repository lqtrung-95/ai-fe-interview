import 'server-only';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

export type PistonResult = {
  run: { stdout: string; stderr: string; code: number };
};

export async function executeJs(code: string, timeoutMs: number): Promise<PistonResult> {
  const res = await fetch(PISTON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'javascript',
      version: '*',
      files: [{ name: 'solution.js', content: code }],
      run_timeout: timeoutMs,
      compile_timeout: 10000,
    }),
    signal: AbortSignal.timeout(timeoutMs + 3000),
  });
  if (!res.ok) throw new Error(`Piston error: ${res.status}`);
  return res.json() as Promise<PistonResult>;
}
