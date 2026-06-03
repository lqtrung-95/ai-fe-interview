# Phase 4 — Settings UI: TargetJobsCard

**Status:** Pending

## Component — `src/features/target-jobs/components/target-jobs-card.tsx`

Placed below `CvProfileCard` in `src/app/(app)/settings/page.tsx`.

### Props

```typescript
interface Props {
  isPro: boolean;
  initialJobs: { id: string; label: string; createdAt: string }[];
}
```

### States

| State | UI |
|-------|----|
| Free user | Lock icon, "Pro feature" badge, upgrade CTA |
| Pro, 0 saved | Empty state + "Add job target" button |
| Pro, 1–3 saved | List of saved jobs + "Add" button (hidden when at limit 3) |
| Adding | Inline form (label + JD textarea) with "Save & extract" button |
| Extracting | Spinner: "Analysing JD…" |
| At limit | List of 3 + "Remove one to add another" hint |

### Saved job list item

Each item shows:
- Label (bold)
- Extracted role + company if available (subdued)
- Delete button (icon, confirm on click)

### Add form

```
Label:  [________________] (e.g. "Stripe Senior FE")
JD:     [                ]
        [  paste the full job description  ]
        [                ]
[Save & extract]  [Cancel]
```

- `label` required, 1–60 chars
- `rawJd` required, min 50 chars
- On submit: `POST /api/target-jobs` → show spinner → on success add to list

### Free-user lock state

Mirrors the dashboard weak-area lock:
```
🔒  Job targeting  [Pro]
    Paste a JD and we'll tailor every question to that specific role and company.
    [Upgrade to Pro]
```

## Settings page update

```typescript
// src/app/(app)/settings/page.tsx
const targetJobs = await prisma.targetJob.findMany({
  where: { userId: user.id },
  select: { id: true, label: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
});

<TargetJobsCard isPro={user.isPro} initialJobs={targetJobs} />
```
