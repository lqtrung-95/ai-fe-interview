# Build & Critique — live component challenges graded on real signals

**The differentiator:** competitors grade frontend interviews with static official
solutions (self-compare) or generic LLM text feedback. Nobody grades your *actual
running UI* with real frontend signals. This builds the first: a sandboxed React
playground that renders your component, runs **axe-core** against the live DOM, and
feeds those real a11y findings into a senior-level AI critique.

## Architecture

- Component challenges can't run in the existing Node `vm` executor (no DOM/React).
  Evaluation moves **client-side** into a sandboxed iframe.
- `iframe sandbox="allow-scripts"` (null origin — no access to parent session/cookies).
  Loads React 18 + ReactDOM 18 + @babel/standalone + axe-core from CDN.
- Harness: Babel transforms the user's JSX → captures the named component via
  `new Function` → renders into a root → runs axe-core → postMessages signals out.
- Signals (axe violations + render errors) flow to the AI critique, grounding it in
  measurements rather than vibes. Reuses the existing `streamCodeReview` (Pro-gated).

## Data model

- One new column: `CodingChallenge.kind` (`'function'` default | `'component'`).
- Component challenges reuse existing columns; `testCases` Json holds the component
  spec `{ componentName }` for kind='component'. No other schema change.

## Phase 1 (this pass) — a11y-graded vertical slice

1. Migration: add `kind`.
2. Sandbox runtime (iframe srcdoc + harness) + `use-component-sandbox` hook.
3. `component-challenge-workspace`: Monaco editor + live preview + axe report panel.
4. Submit route persists component submission; AI critique consumes axe signals.
5. Seed one challenge: **Accessible Star Rating**.
6. Route branches by `kind`; list shows a "Build" badge.
7. Verify: typecheck + build.

## Deferred to Phase 2

- Re-render profiling (needs per-challenge interaction scripts).
- Functional interaction tests (Testing-Library-style in-sandbox).
- More challenges (Accordion, Typeahead, Tabs, Modal).
- "Interview Readiness Score" aggregation layer.
