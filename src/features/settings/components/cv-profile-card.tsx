'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParsedCvPreview } from './parsed-cv-preview';
import type { CvData } from '@/lib/cv/cv-types';

interface Props {
  cvData: CvData | null;
  cvParsedAt: string | null;
}

type Tab = 'upload' | 'paste';
type Status = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export function CvProfileCard({ cvData: initialCvData, cvParsedAt }: Props) {
  const [tab, setTab] = useState<Tab>('upload');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [cvData, setCvData] = useState<CvData | null>(initialCvData);
  const [parsedAt, setParsedAt] = useState(cvParsedAt);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCv = !!cvData;
  const busy = status === 'uploading' || status === 'parsing';

  async function handleFileUpload(file: File) {
    setStatus('uploading');
    setErrorMsg('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/cv/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Upload failed');
      setCvData(data.cvData as CvData);
      setParsedAt(new Date().toISOString());
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  }

  async function handlePasteParse() {
    if (!pasteText.trim()) return;
    setStatus('parsing');
    setErrorMsg('');
    try {
      const res = await fetch('/api/cv/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Parse failed');
      setCvData(data.cvData as CvData);
      setParsedAt(new Date().toISOString());
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Parse failed');
      setStatus('error');
    }
  }

  async function handleDelete() {
    setStatus('uploading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/cv/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCvData(null);
      setParsedAt(null);
      setPasteText('');
      setStatus('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed');
      setStatus('error');
    }
  }

  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">CV / Résumé</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your résumé to get interview questions tailored to your real experience.
          </p>
        </div>
        {hasCv && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={busy}
            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Remove CV
          </Button>
        )}
      </div>

      {hasCv && cvData ? (
        <ParsedCvPreview cvData={cvData} parsedAt={parsedAt} />
      ) : (
        <>
          <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
            {(['upload', 'paste'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'upload' ? 'Upload PDF' : 'Paste text'}
              </button>
            ))}
          </div>

          {tab === 'upload' ? (
            <div className="space-y-3">
              <label
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed',
                  'border-border/60 bg-muted/20 p-8 cursor-pointer transition-colors',
                  'hover:border-primary/40 hover:bg-primary/[0.03]',
                  busy && 'pointer-events-none opacity-50',
                )}
              >
                <Upload className="h-7 w-7 text-muted-foreground/50" />
                <span className="text-sm font-medium text-foreground">
                  {busy ? (status === 'uploading' ? 'Uploading…' : 'Parsing…') : 'Click to upload'}
                </span>
                <span className="text-xs text-muted-foreground">PDF or plain text · max 10 MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the plain text of your résumé here…"
                rows={10}
                disabled={busy}
                className="w-full resize-y rounded-md border border-border/70 bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
              <Button onClick={handlePasteParse} disabled={busy || !pasteText.trim()}>
                {busy ? 'Parsing…' : 'Parse CV'}
                <FileText className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          CV parsed successfully — your next practice session can use it.
        </div>
      )}
      {status === 'error' && errorMsg && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}
    </section>
  );
}
