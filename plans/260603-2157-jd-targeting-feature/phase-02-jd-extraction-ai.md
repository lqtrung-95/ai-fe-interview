# Phase 2 — JD Extraction AI

**Status:** Pending

## Goal

Extract a compact structured context from raw JD text. Runs once when user saves a TargetJob. Result stored in `TargetJob.jdContext`.

## JdContext type

```typescript
// src/features/target-jobs/target-job-types.ts
export interface JdContext {
  role: string;           // "Senior Frontend Engineer"
  company?: string;       // "Stripe" (if mentioned)
  level?: string;         // "senior" | "mid" | etc.
  domain: string;         // "fintech / payments"
  requiredStack: string[]; // ["React", "TypeScript", "GraphQL"]
  signals: string[];      // ["high-ownership", "cross-functional", "distributed-systems"]
}
```

## Add to `ai-schemas.ts`

```typescript
// extract_jd input/output
export const extractJdInputSchema = z.object({
  rawJd: z.string().max(8000), // truncate long JDs
});
export type ExtractJdInput = z.infer<typeof extractJdInputSchema>;

export const extractJdOutputSchema = z.object({
  role: z.string(),
  company: z.string().optional(),
  level: z.string().optional(),
  domain: z.string(),
  requiredStack: z.array(z.string()).max(10),
  signals: z.array(z.string()).max(6),
});
export type ExtractJdOutput = z.infer<typeof extractJdOutputSchema>;
```

Add `extract_jd` to the `AITask` union and `AITaskResult` map.

## Prompt — `jd-extract-prompt.ts`

```
src/lib/ai/prompts/jd-extract-prompt.ts
```

System: You are a job description analyst. Extract structured data from the JD.
- `role`: exact job title from the posting
- `company`: company name if mentioned, else omit
- `level`: seniority level (junior/mid/senior/staff) inferred from requirements
- `domain`: business domain in 3–5 words (e.g. "fintech / payments", "e-commerce / B2C")
- `requiredStack`: up to 10 explicit technologies/frameworks required
- `signals`: up to 6 short culture/working-style keywords from the JD

Output strict JSON matching the schema. If a field can't be inferred, omit it.

User prompt: the raw JD text (truncated to 6 000 chars).

## Orchestrator + model router changes

- Add `extract_jd` branch in `orchestrator.ts` (validate input, build prompt, parse output)
- `model-router.ts`: route `extract_jd` to the cheapest/fastest model (haiku-class)
- Temperature: 0.1 (deterministic extraction)
- Max tokens: 300 (small structured output)

## Usage

Called from `target-job-service.ts` when creating a TargetJob:

```typescript
const ctx = await runAITask({ type: 'extract_jd', input: { rawJd: truncate(rawJd, 6000) } }, { userId });
// store ctx as jdContext on the new TargetJob row
```
