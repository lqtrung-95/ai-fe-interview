---
phase: 3
title: "Voice Answer Input"
status: pending
priority: P2
effort: "2h"
dependencies: []
---

# Phase 3: Voice Answer Input

## Overview

Add a microphone button to the answer textarea so users can dictate their answer using the
browser's native Web Speech API. Transcribed text is appended to the existing `draft` state
in Zustand. Users can edit the transcription before submitting. Zero backend changes; no audio
is stored. Falls back gracefully on unsupported browsers.

## Requirements

- Functional:
  - Mic button toggles recording on/off
  - Live interim results appended to `draft` as user speaks (continuous mode)
  - Pressing Stop (or clicking mic again) commits the final transcript
  - User can edit the text freely before submitting
  - Works alongside the existing typed input — voice and typing are not mutually exclusive
- Non-functional:
  - No audio stored anywhere — browser streams transcription, discards audio
  - Unsupported browsers (Firefox without flag, iOS Safari < 16.4): button hidden
  - Microphone permission denial handled gracefully with a toast/inline error
  - Does not interfere with the countdown timer (Phase 2)

## Architecture

```
AnswerPanel (or wherever the draft textarea lives)
  └─ VoiceInputButton  (new 'use client' component)
       ├─ useSpeechRecognition hook  (new)  →  manages SpeechRecognition lifecycle
       └─ on transcript:  useInterviewStore().setDraft(prev + transcript)
```

The hook returns `{ isListening, isSupported, start, stop, error }`.
The component renders nothing if `!isSupported`.

## Related Code Files

- Create: `src/features/interview/hooks/use-speech-recognition.ts`
- Create: `src/features/interview/components/voice-input-button.tsx`
- Modify: answer panel component (wherever `<textarea>` for `draft` lives — find by grepping `setDraft` or `draft` in `src/features/interview/components/`)

## Implementation Steps

1. **Locate the answer textarea**
   ```bash
   grep -rn "setDraft\|draft" src/features/interview/components/ --include="*.tsx"
   ```
   Note the file name — likely `answer-panel.tsx` or inside `interview-client.tsx`.

2. **Create `src/features/interview/hooks/use-speech-recognition.ts`**
   ```ts
   'use client';

   import { useCallback, useEffect, useRef, useState } from 'react';

   interface UseSpeechRecognitionReturn {
     isSupported: boolean;
     isListening: boolean;
     error: string | null;
     start: () => void;
     stop: () => void;
   }

   export function useSpeechRecognition(
     onTranscript: (text: string) => void,
   ): UseSpeechRecognitionReturn {
     const [isListening, setIsListening] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const recognitionRef = useRef<SpeechRecognition | null>(null);

     const isSupported =
       typeof window !== 'undefined' &&
       ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

     const start = useCallback(() => {
       if (!isSupported) return;
       const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
       const rec = new SR();
       rec.continuous = true;
       rec.interimResults = true;
       rec.lang = 'en-US';

       rec.onresult = (e) => {
         // Collect all result segments since the last onresult
         let transcript = '';
         for (let i = e.resultIndex; i < e.results.length; i++) {
           if (e.results[i].isFinal) {
             transcript += e.results[i][0].transcript;
           }
         }
         if (transcript) onTranscript(transcript);
       };

       rec.onerror = (e) => {
         setError(e.error === 'not-allowed'
           ? 'Microphone access denied. Enable it in browser settings.'
           : `Speech recognition error: ${e.error}`);
         setIsListening(false);
       };

       rec.onend = () => setIsListening(false);

       recognitionRef.current = rec;
       rec.start();
       setIsListening(true);
       setError(null);
     }, [isSupported, onTranscript]);

     const stop = useCallback(() => {
       recognitionRef.current?.stop();
       setIsListening(false);
     }, []);

     // Cleanup on unmount
     useEffect(() => () => recognitionRef.current?.abort(), []);

     return { isSupported, isListening, error, start, stop };
   }
   ```

   > **TypeScript note:** `SpeechRecognition` types come from `lib: ["dom"]` in tsconfig.
   > `webkitSpeechRecognition` needs a manual declaration if TS complains:
   > ```ts
   > declare global {
   >   interface Window { webkitSpeechRecognition?: typeof SpeechRecognition; }
   > }
   > ```

3. **Create `src/features/interview/components/voice-input-button.tsx`**
   ```tsx
   'use client';

   import { Mic, MicOff } from 'lucide-react';
   import { useCallback } from 'react';
   import { useInterviewStore } from '../interview-store';
   import { useSpeechRecognition } from '../hooks/use-speech-recognition';

   export function VoiceInputButton() {
     const { draft, setDraft } = useInterviewStore();

     const handleTranscript = useCallback(
       (text: string) => {
         // Append with a space separator if draft already has content
         setDraft(draft ? `${draft} ${text}` : text);
       },
       [draft, setDraft],
     );

     const { isSupported, isListening, error, start, stop } =
       useSpeechRecognition(handleTranscript);

     if (!isSupported) return null;

     return (
       <div className="flex flex-col items-start gap-1">
         <button
           type="button"
           onClick={isListening ? stop : start}
           title={isListening ? 'Stop recording' : 'Start voice input'}
           className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all ${
             isListening
               ? 'border-red-400/60 bg-red-500/10 text-red-500 hover:bg-red-500/15'
               : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
           }`}
         >
           {isListening
             ? <><MicOff className="h-4 w-4" /> Stop recording</>
             : <><Mic className="h-4 w-4" /> Voice input</>}
           {isListening && (
             <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
           )}
         </button>
         {error && (
           <p className="text-xs text-destructive">{error}</p>
         )}
       </div>
     );
   }
   ```

4. **Add `<VoiceInputButton />` to the answer panel**
   In the answer panel component (found in step 1), import and render it below or beside the
   `<textarea>` and above the submit button row:
   ```tsx
   import { VoiceInputButton } from './voice-input-button';

   // Inside the form/panel:
   <VoiceInputButton />
   ```

5. **TypeScript check**
   ```bash
   pnpm tsc --noEmit
   ```

## Success Criteria

- [ ] Mic button visible below the answer textarea in the interview answering phase
- [ ] Clicking mic requests browser microphone permission
- [ ] Speaking appends transcribed text to the answer draft in real time (final segments only)
- [ ] Active recording shows pulsing red indicator + "Stop recording" label
- [ ] Clicking stop ends the session; text remains editable
- [ ] Permission denial shows an inline error message, not a crash
- [ ] Button is completely absent on browsers that don't support `SpeechRecognition`
- [ ] `pnpm tsc --noEmit` clean

## Risk Assessment

- **`handleTranscript` closure stale `draft`**: Using `draft` from store directly in `useCallback` dep array. If `draft` changes rapidly during speech this could miss updates. Mitigation: use a functional updater `setDraft((prev) => prev ? \`${prev} ${text}\` : text)` to avoid stale closure entirely — cleaner than the dep array approach.
- **iOS Safari**: Web Speech API gated behind a flag on iOS < 16.4; `isSupported` guard hides the button. Users get no degraded experience.
- **Concurrent timer (Phase 2)**: Voice input doesn't pause the countdown timer. This is intentional — the timer auto-submits the current `draft` content, which includes any transcribed text.
