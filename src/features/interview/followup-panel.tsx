'use client';

import type { RecorderStatus } from './hooks/use-audio-transcription';
import { VoiceInputButton } from './components/voice-input-button';

interface Props {
  followUp: string;
  value: string;
  onChange: (value: string) => void;
  micStatus: RecorderStatus;
  onMicToggle: () => void;
}

export function FollowupPanel({ followUp, value, onChange, micStatus, onMicToggle }: Props) {
  return (
    <section className="space-y-4 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium">Follow-up</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{followUp}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Your answer</label>
          <VoiceInputButton status={micStatus} onToggle={onMicToggle} />
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Answer the follow-up, or skip if you want to move on."
          rows={5}
          className="w-full resize-y rounded-md border border-border/70 bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        {micStatus === 'recording' && (
          <p className="text-xs text-muted-foreground">🎙 Recording — click stop to transcribe.</p>
        )}
        {micStatus === 'transcribing' && (
          <p className="text-xs text-muted-foreground">Transcribing…</p>
        )}
        {micStatus === 'error' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Mic error — try again or type.</p>
        )}
      </div>
    </section>
  );
}
