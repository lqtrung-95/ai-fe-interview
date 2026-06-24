// Signals produced by the in-browser component sandbox. These are *real
// measurements* taken against the user's rendered component (not LLM guesses),
// which is what makes the AI critique grounded and unfakeable.

export type A11yImpact = 'minor' | 'moderate' | 'serious' | 'critical' | null;

export interface A11yViolation {
  /** axe rule id, e.g. "button-name", "color-contrast". */
  id: string;
  impact: A11yImpact;
  /** Human-readable description of the rule. */
  help: string;
  helpUrl: string;
  /** Number of DOM nodes that violated this rule. */
  nodes: number;
  /** CSS selectors of up to the first few offending nodes (for display). */
  targets: string[];
}

export interface A11yReport {
  violations: A11yViolation[];
  /** Number of axe rules that passed — a rough "a11y health" denominator. */
  passCount: number;
  /** Set when axe itself failed to run. */
  error?: string;
}

export type SandboxStatus = 'ok' | 'render_error' | 'compile_error';

export interface SandboxResult {
  status: SandboxStatus;
  /** Compile (Babel/JSX) or render-time error message, when status !== 'ok'. */
  renderError?: string;
  /** Null when the component never rendered (compile/render error). */
  a11y: A11yReport | null;
}

/** Messages posted from the sandbox iframe back to the parent app. */
export type SandboxMessage =
  | { source: 'cc-sandbox'; type: 'ready' }
  | { source: 'cc-sandbox'; type: 'result'; payload: SandboxResult };

/** Compact, serializable summary sent to the server for the AI critique. */
export interface A11ySignalSummary {
  status: SandboxStatus;
  renderError?: string;
  violationCount: number;
  seriousOrCritical: number;
  violations: { id: string; impact: A11yImpact; help: string; nodes: number }[];
}

/** Reduce a full SandboxResult to the compact summary persisted + sent to AI. */
export function toSignalSummary(result: SandboxResult): A11ySignalSummary {
  const violations = result.a11y?.violations ?? [];
  return {
    status: result.status,
    renderError: result.renderError,
    violationCount: violations.length,
    seriousOrCritical: violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    ).length,
    violations: violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes,
    })),
  };
}
