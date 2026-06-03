'use client';

import { useTransition, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { redeemPromoCode, type RedeemResult } from './redeem-promo-code-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ERROR_MESSAGES: Record<Exclude<RedeemResult, { success: true }>['error'], string> = {
  invalid_code: 'Code not found. Check for typos.',
  expired_code: 'This code has expired.',
  exhausted: 'This code has reached its usage limit.',
  already_redeemed: 'You have already redeemed this code.',
  already_pro: 'You already have an active paid subscription.',
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(d);
}

export function RedeemCodeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RedeemResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = (inputRef.current?.value ?? '').trim();
    if (!code) return;
    setResult(null);

    startTransition(async () => {
      const res = await redeemPromoCode(code);
      setResult(res);
      if (res.success) {
        // Short delay so user sees the success message before redirect
        setTimeout(() => router.push('/dashboard'), 1800);
      }
    });
  }

  return (
    <div className="mt-10 rounded-xl border border-border bg-card/60 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Have a promo code?</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          name="code"
          placeholder="Enter code"
          className="font-mono uppercase text-sm tracking-wider"
          disabled={isPending || (result?.success ?? false)}
          onBlur={(e) => { e.currentTarget.value = e.currentTarget.value.trim().toUpperCase(); }}
          maxLength={40}
          aria-label="Promo code"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isPending || (result?.success ?? false)}
          className="shrink-0"
        >
          {isPending ? 'Applying…' : 'Apply'}
        </Button>
      </form>

      {result && (
        <div className={`mt-3 flex items-start gap-2 text-sm ${result.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {result.success ? (
            <>
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Pro access granted until <strong>{formatDate(result.expiresAt)}</strong>. Redirecting…
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{ERROR_MESSAGES[result.error]}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
