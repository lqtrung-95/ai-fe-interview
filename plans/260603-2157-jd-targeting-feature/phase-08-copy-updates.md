# Phase 8 — Copy Updates

**Status:** Pending

## `upgrade-wall-dialog.tsx` — PRO_PERKS

Replace the removed "Voice answer input" slot with JD targeting:

```typescript
const PRO_PERKS = [
  'Unlimited practice sessions',
  'Full session history & replays',
  'Spaced repetition study plan',
  'Job-targeted question generation',
  'Per-dimension weak-area coaching',
];
```

## `landing-pricing.tsx` — PRO_FEATURES

```typescript
const PRO_FEATURES = [
  'Unlimited practice sessions',
  'Full session history & replays',
  'Spaced repetition study plan',
  'Job-targeted question generation',   // replaces "Voice answer input"
  'Per-dimension weak-area coaching',
  'Priority AI responses',
];
```

No change to `FREE_FEATURES` — "Voice answer input" was already added there in the previous change.
