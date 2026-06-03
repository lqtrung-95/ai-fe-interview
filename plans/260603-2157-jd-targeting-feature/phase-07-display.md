# Phase 7 — Display: Session Labels

**Status:** Pending

## Practice session page — `src/app/(app)/practice/[sessionId]/page.tsx`

Pass `session.label` and `session.targetJob` down to `InterviewShell`:

```typescript
const session = await prisma.interviewSession.findFirst({
  where: { id: sessionId, userId: user.id },
  include: {
    questions: { ... },
    targetJob: { select: { label: true } }, // add this
  },
});

<InterviewShell
  // ... existing props
  targetLabel={session.label ?? null}
/>
```

## `InterviewShell` / `InterviewMainPanel`

Add a subtle badge in the session header when `targetLabel` is set:

```tsx
{targetLabel && (
  <Badge variant="outline" className="gap-1.5">
    <Briefcase className="h-3 w-3" />
    {targetLabel}
  </Badge>
)}
```

Placed alongside the existing topic/difficulty badges in the header row.

## History page — `session-list-item.tsx`

Fetch `label` in `listSessions` query and display it:

```typescript
// In history-service.ts select
label: true,
```

Show label as a secondary line under the session title when present:

```tsx
{session.label && (
  <p className="text-xs text-muted-foreground flex items-center gap-1">
    <Briefcase className="h-3 w-3" />
    {session.label}
  </p>
)}
```

## History detail page — `src/app/(app)/history/[sessionId]/page.tsx`

Same treatment — show label in the session header so users know which job they were prepping for when reviewing past sessions.
