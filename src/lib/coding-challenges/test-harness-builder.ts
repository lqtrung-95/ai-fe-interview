import 'server-only';

type TestCaseForHarness = {
  id: string;
  input: string;
  expected: string;
};

/**
 * Builds the JS harness string injected into Piston.
 * Includes user code + all test cases (including hidden expected values — server-side only).
 * Parses only the last valid JSON array in stdout to tolerate any user console.log output.
 */
export function buildTestHarness(userCode: string, testCases: TestCaseForHarness[]): string {
  const testsJson = JSON.stringify(testCases);
  // Async IIFE so Promise-returning solutions are awaited correctly.
  // This works because the vm executor awaits the returned Promise.
  return `
(async function() {
${userCode}

const __results = [];
const __tests = ${testsJson};
for (const __t of __tests) {
  try {
    let __actual = eval('solution' + __t.input);
    if (__actual && typeof __actual.then === 'function') {
      __actual = await __actual;
    }
    const __expected = JSON.parse(__t.expected);
    const __passed = JSON.stringify(__actual) === JSON.stringify(__expected);
    __results.push({ id: __t.id, passed: __passed, actual: JSON.stringify(__actual) });
  } catch (__e) {
    __results.push({ id: __t.id, passed: false, error: __e.message });
  }
}
console.log(JSON.stringify(__results));
})();
`.trim();
}
