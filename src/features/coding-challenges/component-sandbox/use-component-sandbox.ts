'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSandboxSrcdoc } from './build-sandbox-srcdoc';
import type { FunctionalCheck, SandboxMessage, SandboxResult } from './sandbox-signals';

/**
 * Drives the sandboxed preview iframe: attach the returned `iframeRef` and
 * `srcdoc` to an <iframe sandbox="allow-scripts">, then call `run(code)` to
 * render the user's component and collect a11y + render + functional signals.
 */
export function useComponentSandbox(componentName: string, checks: FunctionalCheck[] = []) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const srcdoc = useMemo(() => buildSandboxSrcdoc(), []);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only trust messages from our own sandbox frame.
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as SandboxMessage | undefined;
      if (!data || data.source !== 'cc-sandbox') return;
      if (data.type === 'ready') setReady(true);
      if (data.type === 'result') {
        setResult(data.payload);
        setRunning(false);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const run = useCallback(
    (code: string) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      setRunning(true);
      win.postMessage({ type: 'run', code, componentName, checks }, '*');
    },
    [componentName, checks],
  );

  return { iframeRef, srcdoc, ready, running, result, run };
}
