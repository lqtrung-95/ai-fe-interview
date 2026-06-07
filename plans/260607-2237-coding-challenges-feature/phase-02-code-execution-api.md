---
phase: 2
title: "Code Execution API"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Code Execution API

## Overview

Backend API that accepts user code, calls the Piston execution sandbox, runs it against test cases, persists the submission, and returns structured results. Also exposes a read endpoint for challenge data (excluding hidden test case answers and the solution).

## Architecture

```
POST /api/coding-challenges/[id]/submit
  → validate auth + body
  → fetch challenge (verify exists)
  → call Piston API with user code + test harness
  → compare outputs to expected values
  → persist CodingSubmission
  → return { submissionId, status, testResults, passedCount, totalCount, executionMs }

GET /api/coding-challenges
  → list all challenges (safe fields only: no solution, no hidden expected values)

GET /api/coding-challenges/[id]
  → single challenge (safe fields only)
```

**Piston API call shape:**
```ts
POST https://emkc.org/api/v2/piston/execute
{
  language: "javascript",
  version: "*",
  files: [{ name: "solution.js", content: "<harness>" }],
  stdin: "",
  args: [],
  run_timeout: 5000,   // ms, matches challenge.timeLimit
  compile_timeout: 10000
}
```

**Test harness template** (generated per submission):
```js
// User code injected here
<USER_CODE>

// Test runner
const results = [];
const tests = <TEST_CASES_JSON>;
for (const t of tests) {
  try {
    const actual = eval(`solution${t.input}`);
    const expected = JSON.parse(t.expected);
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ id: t.id, passed, actual: JSON.stringify(actual) });
  } catch (e) {
    results.push({ id: t.id, passed: false, error: e.message });
  }
}
console.log(JSON.stringify(results));
```

The harness calls `solution(...)` — all starter code stubs export a function named `solution`.

## Related Code Files

- Create: `src/app/api/coding-challenges/route.ts` — GET list
- Create: `src/app/api/coding-challenges/[id]/route.ts` — GET single
- Create: `src/app/api/coding-challenges/[id]/submit/route.ts` — POST submit
- Create: `src/lib/coding-challenges/piston-client.ts` — Piston API wrapper
- Create: `src/lib/coding-challenges/test-harness-builder.ts` — builds JS harness string
- Create: `src/lib/coding-challenges/submission-validator.ts` — compares actual vs expected
- Create: `src/features/coding-challenges/types.ts` — shared TS types

## Implementation Steps

### 1. Shared types (`src/features/coding-challenges/types.ts`)

```ts
export type TestCasePublic = {
  id: string;
  label: string;
  input: string;
  isHidden: boolean;
  // expected is omitted from public type — never sent to client
};

export type TestResult = {
  id: string;
  passed: boolean;
  actual?: string;   // omitted for hidden cases on client
  error?: string;    // omitted for hidden cases on client
};

export type ChallengePublic = {
  id: string;
  title: string;
  description: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  tags: string[];
  starterCode: string;
  testCases: TestCasePublic[];
  timeLimit: number;
};

export type SubmissionResult = {
  submissionId: string;
  status: 'passed' | 'failed' | 'error';
  testResults: TestResult[];
  passedCount: number;
  totalCount: number;
  executionMs: number | null;
};
```

### 2. Piston client (`src/lib/coding-challenges/piston-client.ts`)

```ts
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
    signal: AbortSignal.timeout(timeoutMs + 3000), // extra buffer for network
  });
  if (!res.ok) throw new Error(`Piston error: ${res.status}`);
  return res.json() as Promise<PistonResult>;
}
```

### 3. Test harness builder (`src/lib/coding-challenges/test-harness-builder.ts`)

Injects user code + test cases into the template. Only passes the test cases' `id`, `input`, and `expected` fields. Hidden expected values ARE included here (server-side only — never returned to client).

### 4. Submission validator (`src/lib/coding-challenges/submission-validator.ts`)

Parses `stdout` from Piston (JSON array of results), merges with the challenge's test case metadata, strips `actual` and `error` values from hidden test results before building the client response.

### 5. Submit route (`src/app/api/coding-challenges/[id]/submit/route.ts`)

```ts
export const runtime = 'nodejs';
// Max execution time: 10s (5s Piston + network + overhead)
export const maxDuration = 30;

// Body: { code: string } — language fixed to "javascript"
// 1. requireUser()
// 2. guardGeneralLimit(user.id)
// 3. Zod validate: code string, min 1, max 20_000 chars
// 4. Fetch challenge from DB (throw 404 if not found)
// 5. Build harness → executeJs() — on fetch/network error, return 503 with
//    { error: 'execution_unavailable', message: 'Code runner is temporarily unavailable. Try again in a moment.' }
// 6. Validate results → compute status ('passed' = ALL test cases pass, 'failed' = any fail, 'error' = runtime exception)
// 7. prisma.codingSubmission.create(...)
// 8. Return SubmissionResult (hidden test actual values stripped)
```

### 6. List + single routes

`GET /api/coding-challenges` — no auth required (public challenge catalog).
Returns array of `ChallengePublic` (no `solution`, no `expected` on hidden cases).

`GET /api/coding-challenges/[id]` — same safe projection.

### 7. Rate limiting

Reuse `guardGeneralLimit`. Submissions are more expensive than answer submissions (Piston call), so apply the same per-user rate limit. No extra limit needed for MVP.

## Success Criteria

- [ ] `POST /api/coding-challenges/[id]/submit` returns correct pass/fail for a working solution
- [ ] Hidden test case `actual` values are never in the response JSON
- [ ] `solution` field never appears in GET responses
- [ ] Piston timeout (5s) is respected; response includes `status: 'error'` on TLE
- [ ] Code > 20 000 chars returns 400
- [ ] Unauthenticated submit returns 401
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Piston rate limits**: Public Piston API is community-shared; no documented rate limits but it can be slow. Add a 30s `maxDuration` on the route. If Piston is down, return a 503 with a user-friendly message.
- **Code injection in harness**: User code runs inside Piston's sandbox (isolated VM). The harness never `eval`s on the server — only inside Piston. Safe.
- **stdout parsing failure**: If user code logs unexpected output before the result JSON, parsing fails. Mitigation: parse only the last valid JSON array in stdout.
