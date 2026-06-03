# Phase 5 — Session Creation

**Status:** Pending

## Schema — `session-config-schema.ts`

Add optional `targetJobId` field:

```typescript
export const createSessionSchema = z.object({
  mode: z.enum(['quick', 'standard', 'deep_coaching']),
  difficulty: z.enum(['junior', 'mid', 'senior']),
  topics: z.array(z.enum(ONBOARDING_TOPICS)).min(1),
  usesCv: z.boolean().optional().default(false),
  targetJobId: z.string().cuid().optional(), // null = no JD targeting
});
```

## Server action — `create-session-action.ts`

When `targetJobId` is provided:
1. Fetch `TargetJob` — verify it belongs to `user.id` (ownership guard)
2. Verify `user.isPro` — return `{ ok: false, code: 'not_pro' }` if not
3. Set `session.label` from `targetJob.label`
4. Set `session.targetJobId`

```typescript
let label: string | undefined;
let targetJobId: string | undefined;

if (parsed.data.targetJobId) {
  if (!user.isPro) return { ok: false, message: 'Pro required', code: 'not_pro' };
  const job = await prisma.targetJob.findFirst({
    where: { id: parsed.data.targetJobId, userId: user.id },
    select: { label: true },
  });
  if (!job) return { ok: false, message: 'Job target not found', code: 'not_found' };
  label = job.label;
  targetJobId = parsed.data.targetJobId;
}

const session = await prisma.interviewSession.create({
  data: { userId: user.id, mode, difficulty, topics, usesCv, label, targetJobId },
  select: { id: true },
});
```

## Form — `topic-selection-form.tsx`

Add a new "Target job" section, placed between the CV toggle and Topics sections. Only rendered when `targetJobs.length > 0 || isPro`.

### New props

```typescript
interface Props {
  // ... existing
  isPro: boolean;
  targetJobs: { id: string; label: string }[]; // fetched server-side
}
```

### Section UI

**When Pro + has saved jobs:**
Radio-style selection — same visual pattern as mode ChoiceCards but smaller.
One card per saved JD + a "None" card (default selected).

```
[ ✓ None — general practice ]
[   Stripe Senior FE         ]
[   Shopify Platform Eng     ]
```

**When Pro + no saved jobs:**
```
No job targets saved yet.
[Manage in Settings →]
```

**When free user:**
Skip the section entirely (don't show a lock here — the lock is in Settings where they'd manage it; no need to gate on the session form since free users simply never have `targetJobs`).

### State

```typescript
const [targetJobId, setTargetJobId] = useState<string | null>(null);
```

Pass `targetJobId ?? undefined` in the `handleStart` payload.

## Practice page — `src/app/(app)/practice/new/page.tsx`

Fetch target jobs server-side and pass to form:

```typescript
const targetJobs = user.isPro
  ? await prisma.targetJob.findMany({
      where: { userId: user.id },
      select: { id: true, label: true },
      orderBy: { createdAt: 'desc' },
    })
  : [];
```
