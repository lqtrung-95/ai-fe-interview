'use client';

import { useRef, useState } from 'react';
import { signOut } from '@/features/auth/sign-out-action';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface SignOutButtonProps {
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Sign-out trigger that confirms before signing the user out. The actual
 * sign-out runs through a hidden <form action={signOut}> so the server-action
 * semantics (pending state, redirect) are preserved — the visible button just
 * opens the confirmation.
 */
export function SignOutButton({ className, ariaLabel, children }: SignOutButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        className={className}
        onClick={() => setConfirming(true)}
      >
        {children}
      </button>

      <form ref={formRef} action={signOut} className="hidden" />

      <ConfirmDialog
        open={confirming}
        title="Sign out?"
        description="You'll need to sign in again to continue practicing."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
