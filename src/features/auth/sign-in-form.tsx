'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function SignInForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }
    setStatus('sent');
  }

  async function handleGoogle() {
    setErrorMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 text-center">
        <h2 className="text-lg font-medium">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleMagicLink} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending'}
          />
        </div>
        <Button type="submit" disabled={status === 'sending' || !email} className="w-full">
          {status === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-xs uppercase tracking-wide text-muted-foreground">or</span>
        </div>
      </div>

      <Button type="button" variant="outline" onClick={handleGoogle} className="w-full">
        Continue with Google
      </Button>

      {errorMessage && (
        <p className="text-center text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
