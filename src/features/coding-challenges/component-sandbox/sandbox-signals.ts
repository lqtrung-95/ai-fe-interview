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

/** React commit counts measured via <Profiler>, before and after a synthetic interaction. */
export interface RenderProfile {
  /** Commits during the initial mount. */
  mountCommits: number;
  /** Commits triggered by auto-clicking the first interactive element. */
  interactionCommits: number;
  /** False when the component had no safe element to interact with. */
  interacted: boolean;
}

/** Declarative functional check, authored per challenge and run against the live DOM. */
export interface FunctionalCheck {
  id: string;
  label: string;
  /** CSS selector to evaluate against the rendered root. */
  selector: string;
  /** At least N matches must exist. */
  minCount?: number;
  /** true → selector must match ≥1; false → must match 0. */
  exists?: boolean;
  /** Every match must carry this attribute (non-empty). */
  everyHasAttr?: string;
}

export interface FunctionalCheckResult {
  id: string;
  label: string;
  passed: boolean;
}

export type SandboxStatus = 'ok' | 'render_error' | 'compile_error';

export interface SandboxResult {
  status: SandboxStatus;
  /** Compile (Babel/JSX) or render-time error message, when status !== 'ok'. */
  renderError?: string;
  /** Null when the component never rendered (compile/render error). */
  a11y: A11yReport | null;
  /** Re-render profile (null on error or if profiling unavailable). */
  render: RenderProfile | null;
  /** Results of the challenge's functional checks (empty if none authored). */
  checks: FunctionalCheckResult[];
}

/** Messages posted from the sandbox iframe back to the parent app. */
export type SandboxMessage =
  | { source: 'cc-sandbox'; type: 'ready' }
  | { source: 'cc-sandbox'; type: 'result'; payload: SandboxResult };

/** Compact, serializable summary sent to the server for the AI critique. */
export interface SignalSummary {
  status: SandboxStatus;
  renderError?: string;
  violationCount: number;
  seriousOrCritical: number;
  violations: { id: string; impact: A11yImpact; help: string; nodes: number }[];
  render: RenderProfile | null;
  checks: FunctionalCheckResult[];
}

/** Reduce a full SandboxResult to the compact summary persisted + sent to AI. */
export function toSignalSummary(result: SandboxResult): SignalSummary {
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
    render: result.render,
    checks: result.checks,
  };
}
