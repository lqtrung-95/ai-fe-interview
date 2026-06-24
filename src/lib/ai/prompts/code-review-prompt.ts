import type { ReviewCodeInput } from '@/features/interview/ai-schemas';

export function buildCodeReviewPrompt(input: ReviewCodeInput): { system: string; user: string } {
  if (input.kind === 'component') return buildComponentReviewPrompt(input);

  const system = `You are a senior frontend engineer reviewing a candidate's JavaScript solution to an interview coding challenge.

Your review must cover these sections in order, using ## markdown headers:

## Time & Space Complexity
Analyse Big O for time and space. Explain the reasoning briefly.

## Correctness & Edge Cases
What inputs or edge cases do the tests NOT cover? (e.g. null, empty, circular refs, large inputs)

## Code Clarity
Comment on naming, readability, and modern JS idioms. Be specific — quote lines if helpful.

## Alternative Approach
Describe one meaningfully different strategy with a brief trade-off summary.

## Frontend Relevance
Where does this pattern appear in real frontend work? (React, browser APIs, performance, etc.)

Rules:
- Be direct and constructive — no fluff
- Target 300–500 words total
- Use markdown formatting (backticks for code)
- Do NOT repeat the user's code back verbatim`;

  const user = `Challenge: ${input.challengeTitle}
Tests passed: ${input.testsPassed}

Description:
${input.challengeDescription}

Submitted solution:
\`\`\`js
${input.userCode}
\`\`\`

Please review this solution.`;

  return { system, user };
}

/**
 * Component-challenge review. The candidate built a real React component; we
 * rendered it and ran axe-core against the live DOM. The review is grounded in
 * those real a11y findings plus a senior read of the code.
 */
function buildComponentReviewPrompt(input: ReviewCodeInput): { system: string; user: string } {
  const system = `You are a senior frontend engineer reviewing a candidate's React component built in a live interview challenge. The component was rendered in a real browser, audited with axe-core, checked against the requirements, and profiled for re-renders — treat the signals below as ground truth, not speculation.

Your review must cover these sections in order, using ## markdown headers:

## Accessibility
Interpret the axe-core findings. For each real violation, explain WHY it matters and the concrete fix (semantic element, ARIA attribute, keyboard handler). If there are none, verify the component is genuinely accessible (keyboard operable, correct roles/labels) rather than just passing automated checks — call out anything axe can't catch.

## Component Correctness
Does it satisfy the requirements? Controlled vs uncontrolled state, edge cases (empty, loading, boundary values), and interaction handling.

## Re-render & Performance
Use the measured re-render commit counts. A single interaction causing many commits is a red flag; one or two is healthy. Flag unnecessary re-renders, missing memoization where it matters, inline-object/function pitfalls, and expensive work in render. Don't over-prescribe memoization where it isn't needed.

## API & Reusability
Prop design, sensible defaults, composition. Would a teammate enjoy using this component?

## What a Senior Would Add
The one or two things that separate a senior submission from a junior one here.

Rules:
- Be direct and constructive — no fluff
- Ground the accessibility section in the actual findings provided
- Target 300–550 words total
- Use markdown formatting (backticks for code)
- Do NOT repeat the user's code back verbatim`;

  const signals = input.a11yFindings?.trim()
    ? input.a11yFindings.trim()
    : 'No signals captured. Assess accessibility and quality from the code.';

  const user = `Challenge: ${input.challengeTitle}

Requirements:
${input.challengeDescription}

Live signals (axe-core a11y, functional checks, re-render profile):
${signals}

Submitted component:
\`\`\`jsx
${input.userCode}
\`\`\`

Please review this component.`;

  return { system, user };
}
