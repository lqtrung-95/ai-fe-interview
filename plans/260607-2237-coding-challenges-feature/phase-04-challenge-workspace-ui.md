---
phase: 4
title: "Challenge Workspace UI"
status: completed
priority: P1
effort: "5h"
dependencies: [3]
---

# Phase 4: Challenge Workspace UI

## Overview

The core interaction surface at `/coding-challenges/[id]` — a split-pane layout with the challenge description on the left and a Monaco code editor + test results panel on the right.

## Architecture

```
/coding-challenges/[id]/page.tsx  (server component — fetches challenge)
  └── ChallengeWorkspace          (client component — owns all interactive state)
      ├── ChallengeDescription    (left panel — markdown description, test cases list)
      └── CodeEditorPanel         (right panel)
          ├── MonacoEditor        (@monaco-editor/react)
          ├── SubmitButton
          └── TestResultsPanel    (appears after submission)
               ├── TestResultRow[] (per visible test case)
               └── HiddenTestsSummary ("X / Y hidden tests passed")
```

**State managed in `ChallengeWorkspace`:**
```ts
{
  code: string;                          // current editor content
  submissionResult: SubmissionResult | null;
  isSubmitting: boolean;
  aiReview: string | null;
  isRequestingAiReview: boolean;
}
```

No TanStack Query needed — submit is a one-shot mutation via `fetch`. Code is stored only in component state (no persistence — users re-type or can use browser back).

## Related Code Files

- Install: `@monaco-editor/react` (new dependency)
- Create: `src/app/(app)/coding-challenges/[id]/page.tsx`
- Create: `src/app/(app)/coding-challenges/[id]/loading.tsx`
- Create: `src/features/coding-challenges/challenge-workspace.tsx`
- Create: `src/features/coding-challenges/challenge-description.tsx`
- Create: `src/features/coding-challenges/code-editor-panel.tsx`
- Create: `src/features/coding-challenges/test-results-panel.tsx`
- Create: `src/features/coding-challenges/hidden-tests-summary.tsx`

## Implementation Steps

### 1. Install Monaco

```bash
pnpm add @monaco-editor/react
```

Monaco bundles its own workers. With Next.js App Router + Turbopack, add to `next.config.ts`:
```ts
webpack: (config) => {
  // Monaco requires this — workers are loaded from CDN by default
  return config;
}
```
No extra webpack config needed when using `@monaco-editor/react`'s default CDN worker strategy.

### 2. Page server component

```tsx
// src/app/(app)/coding-challenges/[id]/page.tsx
export default async function ChallengePage({ params }: { params: { id: string } }) {
  const challenge = await getChallengeById(params.id); // throws notFound() if missing
  return <ChallengeWorkspace challenge={challenge} />;
}
```

### 3. Split-pane layout

Use CSS `grid` with `grid-cols-[1fr_1fr]` on desktop, stacked on mobile (`grid-cols-1`). Both panels are independently scrollable (`overflow-y-auto`).

```
┌─────────────────────┬──────────────────────┐
│  Challenge          │  Monaco Editor       │
│  Description        │                      │
│                     │  [Submit]            │
│  Test Cases         ├──────────────────────┤
│  (visible only)     │  Test Results        │
└─────────────────────┴──────────────────────┘
```

### 4. Monaco editor component

```tsx
// src/features/coding-challenges/code-editor-panel.tsx
import Editor from '@monaco-editor/react';

// Props: starterCode, value, onChange, isSubmitting
// Config:
//   language="javascript"
//   theme="vs-dark" | "light" (follow app theme via useTheme)
//   options: { fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }
// On mount: set editor value to starterCode (only on first mount — don't reset on re-render)
```

### 5. Submit flow

1. User clicks "Run & Submit" button (disabled while `isSubmitting`)
2. `isSubmitting = true`, call `POST /api/coding-challenges/[id]/submit` with `{ code }`
3. On success: set `submissionResult`, `isSubmitting = false`
4. On error (network / 503 Piston down): show toast error via shadcn `useToast`

### 6. Test results panel

`src/features/coding-challenges/test-results-panel.tsx`

Rendered below the editor after submission. Shows:
- Overall banner: "✓ All tests passed" (green) or "✗ X / Y tests failed" (red/yellow)
- Per visible test: label, pass/fail icon, actual vs expected (collapsed by default, expand on click)
- Hidden tests summary: "Hidden tests: 3 / 5 passed" (no actual/expected values)

Visible test collapsible uses shadcn `Collapsible` (already in the project).

### 7. Reset button

Small "Reset to starter" button (ghost variant) in editor header. Sets editor value back to `starterCode`, clears `submissionResult`.

### 8. Auth gate on submit

If user is unauthenticated and clicks submit, show a dialog prompting sign-in (same pattern as Pro upgrade prompts). The editor is still usable — only submission is gated.

## Success Criteria

- [ ] Monaco editor loads and accepts JS input without page errors
- [ ] Editor theme matches app light/dark theme
- [ ] "Run & Submit" calls the API and shows test results
- [ ] All-pass state shows green banner; partial-pass shows yellow; all-fail shows red
- [ ] Hidden test results show only pass/fail counts — no actual values visible in DOM
- [ ] "Reset to starter" restores the original function stub
- [ ] Layout doesn't break on mobile (stacked panels)
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Monaco bundle size**: ~2MB. Lazy-load it with `dynamic(() => import('@monaco-editor/react'), { ssr: false })` so the editor only loads on the workspace page, not the list.
- **Hydration mismatch**: Monaco is browser-only — `ssr: false` in `dynamic()` handles this.
- **Theme sync**: `useTheme()` from `next-themes` (already used in the project) provides the current theme string — map to `"vs-dark"` / `"light"`.
