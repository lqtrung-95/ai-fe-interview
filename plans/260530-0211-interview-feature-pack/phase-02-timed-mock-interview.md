---
phase: 2
title: "Timed Mock Interview"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 2: Timed Mock Interview

## Overview

Add an optional per-question countdown timer to the interview session. User configures time
per question (off / 1 / 2 / 3 / 5 min) on the practice setup page. A visual ring + countdown
renders during the `answering` phase. When the timer expires, the answer is auto-submitted
(same as clicking "Submit"). Timer state lives in Zustand alongside existing interview phases.

## Requirements

- Functional:
  - Timer is opt-in — default off; users toggle it in the session setup form
  - Supported values: off, 1 min, 2 min, 3 min, 5 min
  - Visual countdown ring shows remaining time, turns amber <30s, red <10s
  - Auto-submits when timer hits 0 (calls existing `submitAnswer()` flow)
  - Timer resets for each new question
  - Timer pauses while feedback is loading (phase ≠ `answering`)
  - Selected timer setting persisted to URL param `?timer=2` so the session page can read it
- Non-functional:
  - No backend changes — `timePerQuestion` is client-only session config
  - `useEffect`-based interval, cleaned up on unmount and phase change

## Architecture

```
TopicSelectionForm  →  ?timer=N in URL
                              ↓
InterviewSessionPage  reads searchParam → passes timerSeconds to InterviewClient
                              ↓
InterviewClient  →  useInterviewFlow({ timerSeconds })
                              ↓
interview-store.ts  adds: timerSeconds | timeLeft | timerActive
                              ↓
useTimerEffect (new hook)  →  ticks every second, calls submitAnswer() at 0
                              ↓
CountdownRing component  ←  reads timeLeft from store
```

## Related Code Files

- Modify: `src/features/interview/interview-store.ts` — add timer fields + actions
- Create: `src/features/interview/hooks/use-interview-timer.ts` — tick effect
- Create: `src/features/interview/components/countdown-ring.tsx` — SVG ring UI
- Modify: `src/features/interview/topic-selection-form.tsx` — add timer picker
- Modify: `src/app/(app)/practice/[sessionId]/page.tsx` — read `?timer` param, pass down
- Modify: `src/features/interview/components/answer-panel.tsx` (or wherever answer textarea lives) — render `CountdownRing`

## Implementation Steps

1. **Extend `interview-store.ts`**
   Add to state:
   ```ts
   timerSeconds: number;      // 0 = off
   timeLeft: number;          // seconds remaining (reset per question)
   timerActive: boolean;      // true only during 'answering' phase
   ```
   Add actions:
   ```ts
   setTimerSeconds: (s: number) => void;
   tickTimer: () => void;       // called by useInterviewTimer every second
   resetTimer: () => void;      // called when a new question loads
   ```
   `resetTimer` sets `timeLeft = timerSeconds`, `timerActive = timerSeconds > 0`.
   `tickTimer` decrements `timeLeft`; sets `timerActive = false` when it hits 0
   (the effect calls `submitAnswer()` before this).
   Also call `resetTimer()` inside `setLoadedQuestion`.

2. **Create `src/features/interview/hooks/use-interview-timer.ts`**
   ```ts
   'use client';
   import { useEffect } from 'react';
   import { useInterviewStore } from '../interview-store';

   export function useInterviewTimer(submitAnswer: () => Promise<void>) {
     const { phase, timerActive, timeLeft, tickTimer } = useInterviewStore();

     useEffect(() => {
       if (phase !== 'answering' || !timerActive) return;
       const id = setInterval(() => {
         if (timeLeft <= 1) {
           clearInterval(id);
           submitAnswer();   // auto-submit
         } else {
           tickTimer();
         }
       }, 1000);
       return () => clearInterval(id);
     }, [phase, timerActive, timeLeft, tickTimer, submitAnswer]);
   }
   ```

3. **Create `src/features/interview/components/countdown-ring.tsx`**
   SVG circle ring with:
   - `r=20`, `cx=26 cy=26`, `strokeDasharray` driven by `timeLeft / timerSeconds`
   - Color: green → amber (<30s) → red (<10s) via Tailwind class swap
   - Center text: `MM:SS` formatted
   ```tsx
   'use client';
   import { useInterviewStore } from '../interview-store';

   export function CountdownRing() {
     const { timerSeconds, timeLeft, timerActive } = useInterviewStore();
     if (!timerActive && timeLeft === timerSeconds) return null; // hidden when off
     const pct = timerSeconds > 0 ? timeLeft / timerSeconds : 1;
     const CIRC = 2 * Math.PI * 20; // r=20
     const mins = Math.floor(timeLeft / 60);
     const secs = timeLeft % 60;
     const color = timeLeft < 10 ? 'text-red-500 stroke-red-500'
                 : timeLeft < 30 ? 'text-amber-500 stroke-amber-500'
                 : 'text-primary stroke-primary';
     return (
       <div className={`relative inline-flex items-center justify-center ${color}`}>
         <svg width="52" height="52" className="-rotate-90">
           <circle cx="26" cy="26" r="20" fill="none" strokeWidth="3"
             className="stroke-muted" />
           <circle cx="26" cy="26" r="20" fill="none" strokeWidth="3"
             strokeDasharray={CIRC}
             strokeDashoffset={CIRC * (1 - pct)}
             strokeLinecap="round"
             className="transition-all duration-1000" />
         </svg>
         <span className="absolute text-xs font-mono font-semibold tabular-nums">
           {mins}:{String(secs).padStart(2, '0')}
         </span>
       </div>
     );
   }
   ```

4. **Add timer picker to `TopicSelectionForm`**
   Below the mode/difficulty selectors, add:
   ```tsx
   <div className="space-y-2">
     <label className="text-sm font-medium">Time per question</label>
     <div className="flex flex-wrap gap-2">
       {[0, 60, 120, 180, 300].map((s) => (
         <ChoiceCard
           key={s}
           label={s === 0 ? 'No limit' : `${s / 60} min`}
           active={timer === s}
           onClick={() => setTimer(s)}
         />
       ))}
     </div>
   </div>
   ```
   Hidden `<input name="timer" value={timer} />` submits with the form.
   The session creation action or redirect includes `?timer=N`.

5. **Read `?timer` param in session page and pass to store**
   In `src/app/(app)/practice/[sessionId]/page.tsx`:
   ```ts
   const timerSeconds = Number(searchParams.timer ?? 0);
   ```
   Pass as prop to `<InterviewClient timerSeconds={timerSeconds} />`.
   In `InterviewClient`, call `state.setTimerSeconds(timerSeconds)` on mount.

6. **Wire `useInterviewTimer` into `useInterviewFlow`**
   At the bottom of the hook:
   ```ts
   useInterviewTimer(submitAnswer);
   ```

7. **Render `<CountdownRing />` in the answering UI**
   In the answer panel, above or beside the submit button.

8. **TypeScript + compile check**
   ```bash
   pnpm tsc --noEmit
   ```

## Success Criteria

- [ ] Timer picker renders on the practice setup page (off / 1 / 2 / 3 / 5 min)
- [ ] `?timer=N` param threads through to the interview session
- [ ] Countdown ring visible during answering phase when timer is active
- [ ] Ring turns amber <30s, red <10s
- [ ] Answer auto-submits when timer hits 0
- [ ] Timer resets when a new question loads
- [ ] No timer rendered when user chose "No limit"
- [ ] `pnpm tsc --noEmit` clean

## Risk Assessment

- **Race between auto-submit and user click**: `submitAnswer()` in `use-interview-flow.ts` already guards against empty draft; double-submit is safe because the phase transitions to `submitting` immediately, blocking re-entry.
- **`setInterval` drift**: 1s interval is acceptable UX precision; no need for `performance.now()` correction.
- **Timer state across HMR in dev**: Zustand store is module-scoped; HMR will reset timer state. This is expected dev-only behaviour.
