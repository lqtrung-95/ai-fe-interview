// Builds the HTML document loaded into the sandboxed preview iframe.
//
// The iframe runs with sandbox="allow-scripts" (NO allow-same-origin), so it has
// a null origin and cannot touch the parent app's cookies, storage, or DOM. It
// loads React 18 + ReactDOM 18 + @babel/standalone + axe-core from a CDN (the app
// has no CSP that would block this). React 18 (not the app's 19) is used because
// it ships a UMD global build. The *development* build is required so <Profiler>
// onRender fires (production React disables it) — that powers re-render counting.
//
// Protocol:
//   parent -> iframe:  { type: 'run', code, componentName, checks }
//   iframe -> parent:  { source:'cc-sandbox', type:'ready' }
//                      { source:'cc-sandbox', type:'result', payload: SandboxResult }

const CDN = {
  react: 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js',
  reactDom: 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js',
  babel: 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js',
  axe: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js',
};

// The harness script that lives inside the iframe. Kept as a plain string so it
// runs in the sandbox's own JS context, isolated from the app bundle.
const HARNESS = `
(function () {
  var root = document.getElementById('root');
  var reactRoot = null;
  var commitCount = 0;

  function post(msg) { msg.source = 'cc-sandbox'; parent.postMessage(msg, '*'); }
  function errMsg(e) { return (e && e.message) ? e.message : String(e); }
  function fail(status, message) {
    post({ type: 'result', payload: { status: status, renderError: message, a11y: null, render: null, checks: [] } });
  }

  // Error boundary so a throwing component reports instead of silently blanking.
  function makeBoundary() {
    function EB(props) { React.Component.call(this, props); this.state = { err: null }; }
    EB.prototype = Object.create(React.Component.prototype);
    EB.getDerivedStateFromError = function (err) { return { err: errMsg(err) }; };
    EB.prototype.componentDidCatch = function (err) { window.__renderError = errMsg(err); };
    EB.prototype.render = function () {
      if (this.state.err) {
        return React.createElement('div', { role: 'alert', style: 'color:#b91c1c;font:14px system-ui' },
          'Render error: ' + this.state.err);
      }
      return this.props.children;
    };
    return EB;
  }

  function runChecks(checks) {
    if (!checks || !checks.length) return [];
    return checks.map(function (c) {
      var passed = false;
      try {
        var nodes = root.querySelectorAll(c.selector);
        if (typeof c.minCount === 'number') passed = nodes.length >= c.minCount;
        else if (typeof c.exists === 'boolean') passed = c.exists ? nodes.length > 0 : nodes.length === 0;
        else if (c.everyHasAttr) passed = nodes.length > 0 && Array.prototype.every.call(nodes, function (n) {
          var a = n.getAttribute(c.everyHasAttr); return a !== null && a !== '';
        });
        else passed = nodes.length > 0;
      } catch (e) { passed = false; }
      return { id: c.id, label: c.label, passed: passed };
    });
  }

  async function run(code, componentName, checks) {
    window.__renderError = null;
    commitCount = 0;

    var transformed;
    try { transformed = Babel.transform(code, { presets: ['react'] }).code; }
    catch (e) { fail('compile_error', errMsg(e)); return; }

    var Component;
    try {
      var factory = new Function('React',
        transformed + '\\n;return typeof ' + componentName + " !== 'undefined' ? " + componentName +
        ' : (typeof exports !== "undefined" && exports.default) || null;');
      Component = factory(React);
    } catch (e) { fail('compile_error', errMsg(e)); return; }
    if (!Component) {
      fail('compile_error', 'Component "' + componentName + '" not found. Name your component ' + componentName + '.');
      return;
    }

    try {
      if (reactRoot) reactRoot.unmount();
      root.innerHTML = '';
      reactRoot = ReactDOM.createRoot(root);
      var EB = makeBoundary();
      var tree = React.createElement(EB, null, React.createElement(Component));
      // Profiler counts commits (re-renders) in the subtree.
      var profiled = React.createElement(React.Profiler, { id: 'cc', onRender: function () { commitCount++; } }, tree);
      reactRoot.render(profiled);
    } catch (e) { fail('render_error', errMsg(e)); return; }

    await new Promise(function (r) { setTimeout(r, 180); });
    if (window.__renderError) { fail('render_error', window.__renderError); return; }

    var mountCommits = commitCount;
    var checkResults = runChecks(checks);

    var a11y;
    try {
      var results = await axe.run(root);
      a11y = {
        passCount: (results.passes || []).length,
        violations: (results.violations || []).map(function (v) {
          return {
            id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
            nodes: v.nodes.length,
            targets: v.nodes.slice(0, 3).map(function (n) { return (n.target || []).join(' '); }),
          };
        }),
      };
    } catch (e) { a11y = { passCount: 0, violations: [], error: errMsg(e) }; }

    // Synthetic interaction: click the first safe interactive element and count
    // the re-render commits it causes. Skips links/text inputs (navigation/typing).
    var interacted = false;
    var interactionCommits = 0;
    try {
      var target = root.querySelector('button, [role="radio"], [role="switch"], input[type="checkbox"], input[type="radio"]');
      if (target) {
        interacted = true;
        target.click();
        await new Promise(function (r) { setTimeout(r, 200); });
        interactionCommits = commitCount - mountCommits; // capture BEFORE remount
        // Remount fresh so the visible preview returns to its initial state —
        // the synthetic click shouldn't leave the component (e.g. a modal) altered.
        reactRoot.unmount();
        reactRoot = ReactDOM.createRoot(root);
        reactRoot.render(profiled);
        await new Promise(function (r) { setTimeout(r, 60); });
      }
    } catch (e) { /* interaction errors shouldn't fail the run */ }

    post({ type: 'result', payload: {
      status: 'ok',
      a11y: a11y,
      render: { mountCommits: mountCommits, interactionCommits: interactionCommits, interacted: interacted },
      checks: checkResults,
    } });
  }

  window.addEventListener('message', function (e) {
    var data = e.data || {};
    if (data.type === 'run') run(data.code, data.componentName, data.checks);
  });

  post({ type: 'ready' });
})();
`;

/** Returns the full srcdoc HTML for the sandbox iframe. Static — code is sent at runtime via postMessage. */
export function buildSandboxSrcdoc(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body { margin: 0; }
  body { padding: 16px; font: 14px/1.5 system-ui, sans-serif; color: #111; background: #fff; }
  #root:empty::after { content: 'Run your component to preview it here.'; color: #9ca3af; }
</style>
<script src="${CDN.react}" crossorigin></script>
<script src="${CDN.reactDom}" crossorigin></script>
<script src="${CDN.babel}" crossorigin></script>
<script src="${CDN.axe}" crossorigin></script>
</head>
<body>
<div id="root"></div>
<script>${HARNESS}</script>
</body>
</html>`;
}
