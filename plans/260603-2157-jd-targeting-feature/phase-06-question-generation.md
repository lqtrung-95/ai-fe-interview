# Phase 6 — Question Generation: Inject jdContext

**Status:** Pending

## `ai-schemas.ts` — add `jdContext` to `QuestionInput`

```typescript
export const questionInputSchema = z.object({
  // ... existing fields
  cvContext: z.string().max(1200).optional(),
  // JD context injected when session has a targetJobId
  jdContext: z.string().max(600).optional(),
});
```

Max 600 chars — compact formatted string, not raw JD.

## `question-service.ts` — fetch and inject jdContext

Add after the `cvContext` block:

```typescript
let jdContext: string | undefined;
if (args.session.targetJobId) {
  const job = await prisma.targetJob.findUnique({
    where: { id: args.session.targetJobId },
    select: { jdContext: true },
  });
  if (job?.jdContext) {
    jdContext = formatJdContext(job.jdContext as JdContext);
  }
}
```

`formatJdContext` lives in `target-job-types.ts`:

```typescript
export function formatJdContext(ctx: JdContext): string {
  const lines = [
    `Target role: ${ctx.role}`,
    ctx.company ? `Company: ${ctx.company}` : null,
    `Domain: ${ctx.domain}`,
    ctx.requiredStack.length ? `Required stack: ${ctx.requiredStack.join(', ')}` : null,
    ctx.signals.length ? `Culture signals: ${ctx.signals.join(', ')}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}
```

Pass `jdContext` into the `QuestionInput` alongside `cvContext`.

## `question-prompt.ts` — handle jdContext

Add a `jdContext` block similar to `cvBlock`:

```typescript
const jdInstruction = input.jdContext
  ? '\n- Questions must probe technologies and domains from the target JD. ' +
    'Prefer scenario framing tied to the company domain (e.g. high-scale payments, marketplace, SaaS).'
  : '';

// ... add to system instructions

const jdBlock = input.jdContext
  ? `\n\nTarget job context:\n${input.jdContext}`
  : '';

// ... add jdBlock to user prompt
```

## Priority: jdContext > targetRole/targetCompanyType

When `jdContext` is present it supersedes the generic `targetRole`/`targetCompanyType` from the user profile — no change needed in logic since the prompt naturally gives more weight to the richer context.

## Note on cost

One extra DB read per question (fetch `TargetJob.jdContext`). Acceptable — single-row PK lookup, ~1 ms. No additional AI call.
