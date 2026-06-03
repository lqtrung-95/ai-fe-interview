'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  onSaved: (job: { id: string; label: string }) => void;
  onCancel: () => void;
}

export function TargetJobAddForm({ onSaved, onCancel }: Props) {
  const [label, setLabel] = useState('');
  const [rawJd, setRawJd] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSave() {
    if (!label.trim() || rawJd.trim().length < 50) return;
    setStatus('saving');
    setError('');
    try {
      const res = await fetch('/api/target-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), rawJd: rawJd.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Failed to save');
      onSaved(data.targetJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStatus('error');
    }
  }

  const busy = status === 'saving';

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='e.g. "Stripe Senior FE"'
          maxLength={100}
          disabled={busy}
          className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Job description</label>
        <textarea
          value={rawJd}
          onChange={(e) => setRawJd(e.target.value)}
          placeholder="Paste the full job description here…"
          rows={8}
          disabled={busy}
          className="w-full resize-y rounded-md border border-border/70 bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={busy || !label.trim() || rawJd.trim().length < 50}
          size="sm"
        >
          {busy ? 'Analysing JD…' : 'Save & extract'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
