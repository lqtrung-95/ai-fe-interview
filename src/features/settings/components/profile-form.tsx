'use client';

import { useRef, useState, useTransition } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileAction } from '../server/update-profile-action';

interface Props {
  userId: string;
  initialName: string | null;
  initialAvatarUrl: string | null;
  email: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Initials fallback — first letter of name or email. */
function initials(name: string | null, email: string) {
  const src = name?.trim() || email;
  return src.slice(0, 1).toUpperCase();
}

export function ProfileForm({ userId, initialName, initialAvatarUrl, email }: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  // Local preview blob URL while the file hasn't been uploaded yet
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const displayAvatar = previewUrl ?? avatarUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show a local preview immediately
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setPendingFile(file);
    setSaveState('idle');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState('saving');
    setErrorMsg(null);

    try {
      let newAvatarUrl: string | null | undefined = undefined; // undefined = don't change

      if (pendingFile) {
        // Upload avatar to Supabase Storage (avatars bucket, public)
        const supabase = createSupabaseBrowserClient();
        const ext = pendingFile.name.split('.').pop() ?? 'jpg';
        // Overwrite the same path each time so old files don't accumulate
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, pendingFile, { upsert: true, contentType: pendingFile.type });

        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        // Bust the CDN cache with a timestamp query param
        newAvatarUrl = `${publicUrl}?t=${Date.now()}`;
        setAvatarUrl(newAvatarUrl);
        setPreviewUrl(null);
        setPendingFile(null);
      }

      await new Promise<void>((resolve, reject) =>
        startTransition(async () => {
          try {
            await updateProfileAction({ name, avatarUrl: newAvatarUrl });
            resolve();
          } catch (err) {
            reject(err);
          }
        })
      );

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      setSaveState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const isBusy = saveState === 'saving' || isPending;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          aria-label="Change avatar"
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border/70 bg-muted transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={name || email}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
              {initials(name, email)}
            </span>
          )}
          {/* Hover overlay */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        <div className="min-w-0">
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, GIF or WebP · max 2 MB
          </p>
          {pendingFile && (
            <p className="mt-0.5 text-xs text-primary">
              New photo selected — save to apply.
            </p>
          )}
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaveState('idle'); }}
          disabled={isBusy}
          maxLength={80}
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          Shown in the sidebar and on your dashboard.
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isBusy} className="min-w-24">
          {isBusy ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
          ) : saveState === 'saved' ? (
            <><Check className="mr-2 h-4 w-4" /> Saved</>
          ) : (
            'Save changes'
          )}
        </Button>
        {saveState === 'error' && errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}
        {saveState === 'error' && !errorMsg && (
          <p className="text-sm text-destructive">Failed to save. Please try again.</p>
        )}
      </div>
    </form>
  );
}
