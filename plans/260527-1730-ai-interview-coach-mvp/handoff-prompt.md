# Handoff Prompt

Drop this verbatim into a fresh agent session (Codex, Claude, Cursor, Aider) to
continue work on this project. The agent will discover state by reading the
referenced files — no in-prompt code dump needed.

---

```
You are continuing work on the AI Interview Coach MVP — a Next.js 16 + Supabase web
app that runs AI-led frontend mock interviews. The project is partially built.

START BY READING (in order):
1. PRD.md — the product spec
2. docs/system-architecture.md — locked tech stack, AI orchestrator design, data model
3. plans/260527-1730-ai-interview-coach-mvp/plan.md — overall progress + "Resume here"
   snapshot with blockers, next steps, and known gotchas
4. plans/260527-1730-ai-interview-coach-mvp/phase-02-interview-flow.md — checkbox state
   for Phase 02 (the active phase) and "How to finish Phase 02" section

THEN:

- Pick up the next unchecked item from Phase 02's "How to finish" list (or move to
  Phase 03 if user directs). The four pending Phase 02 pieces, in priority:
    1. Switch question generation route to SSE streaming (use Vercel AI SDK's
       streamObject; add `streamAITask` next to `runAITask` in lib/ai/orchestrator.ts).
    2. Update InterviewShell to consume the stream.
    3. Wire the follow-up prompt (already exists in lib/ai/prompts/followup-prompt.ts)
       into a new POST /api/answers/[id]/followup route + UI.
    4. Expand session-service with read/end endpoints.

NON-NEGOTIABLE RULES:
- Stack is LOCKED (Next.js 16, Prisma 7 + pg adapter, Supabase, Groq default with
  OpenAI/Anthropic fallback, Vercel AI SDK 6, shadcn). Do NOT re-debate.
- All files <200 LoC. Modularize aggressively.
- Server-only modules: `import 'server-only'`.
- All AI calls MUST route through lib/ai/orchestrator.ts. No direct provider calls.
- All Route Handlers MUST call requireUser() first.
- Every code change: run `pnpm typecheck` before declaring done.
- Use kebab-case for TS/TSX file names.
- Don't create markdown outside `plans/` or `docs/` unless asked.

GOTCHAS (don't relearn — see plan.md for full list):
- Next 16: middleware is src/proxy.ts; cookies()/headers()/params/searchParams are async.
- Prisma 7: no `url` in schema — lives in prisma.config.ts; runtime uses @prisma/adapter-pg.
- Supabase IPv4: must use Session Pooler URL on port 5432.
- shadcn Button has no `asChild` here — use buttonVariants() className on <Link>.
- Port 3000 is taken on user's machine — use `PORT=3001 pnpm dev`.

WHEN DONE WITH EACH ITEM:
- Update the matching checkbox in the relevant phase file.
- Update plan.md "Resume here" snapshot if status meaningfully changed.
- Run `pnpm typecheck`.
- Report what changed in 3-5 bullets.
```

---

## Variants

**To skip ahead** (e.g. Phase 03 instead of finishing Phase 02 streaming):
Append: `Skip the Phase 02 streaming work. Start Phase 03 from phase-03-feedback-summary.md instead.`

**To bound the session**:
Append: `Stop after completing 2 tasks. Do not start a third.`

**For an agent that does not auto-cd** (some Codex / Aider setups):
Prepend: `cd "/Users/lequoctrung/Documents/Personal Projects/ai-interview-coach" && `
