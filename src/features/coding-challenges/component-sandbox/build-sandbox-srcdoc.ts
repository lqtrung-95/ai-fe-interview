// Builds the HTML document loaded into the sandboxed preview iframe.
//
// The iframe runs with sandbox="allow-scripts" (NO allow-same-origin), so it has
// a null origin and cannot touch the parent app's cookies, storage, or DOM. It
// loads React 18 + ReactDOM 18 + @babel/standalone + axe-core from a CDN (the app
// has no CSP that would block this). React 18 (not the app's 19) is used purely
// because it ships a UMD global build suitable for a script-tag sandbox.
//
// Protocol:
//   parent -> iframe:  { type: 'run', code, componentName }
//   iframe -> parent:  { source:'cc-sandbox', type:'ready' }
//                      { source:'cc-sandbox', type:'result', payload: SandboxResult }

const CDN = {
  react: 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
  reactDom: 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
  babel: 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js',
  axe: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js',
};

// The harness script that lives inside the iframe. Kept as a plain string so it
// runs in the sandbox's own JS context, isolated from the app bundle.
const HARNESS = `
(function () {
  var root = document.getElementById('root');
  var reactRoot = null;

  function post(msg) {
    msg.source = 'cc-sandbox';
    parent.postMessage(msg, '*');
  }
  function errMsg(e) { return (e && e.message) ? e.message : String(e); }

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

  async function run(code, componentName) {
    window.__renderError = null;

    var transformed;
    try {
      transformed = Babel.transform(code, { presets: ['react'] }).code;
    } catch (e) {
      post({ type: 'result', payload: { status: 'compile_error', renderError: errMsg(e), a11y: null } });
      return;
    }

    var Component;
    try {
      var factory = new Function('React',
        transformed + '\\n;return typeof ' + componentName + " !== 'undefined' ? " + componentName +
        ' : (typeof exports !== "undefined" && exports.default) || null;');
      Component = factory(React);
    } catch (e) {
      post({ type: 'result', payload: { status: 'compile_error', renderError: errMsg(e), a11y: null } });
      return;
    }
    if (!Component) {
      post({ type: 'result', payload: { status: 'compile_error',
        renderError: 'Component "' + componentName + '" not found. Name your component ' + componentName + '.',
        a11y: null } });
      return;
    }

    try {
      if (reactRoot) reactRoot.unmount();
      root.innerHTML = '';
      reactRoot = ReactDOM.createRoot(root);
      var EB = makeBoundary();
      reactRoot.render(React.createElement(EB, null, React.createElement(Component)));
    } catch (e) {
      post({ type: 'result', payload: { status: 'render_error', renderError: errMsg(e), a11y: null } });
      return;
    }

    // Let effects run and the DOM paint before auditing.
    await new Promise(function (r) { setTimeout(r, 180); });

    if (window.__renderError) {
      post({ type: 'result', payload: { status: 'render_error', renderError: window.__renderError, a11y: null } });
      return;
    }

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
    } catch (e) {
      a11y = { passCount: 0, violations: [], error: errMsg(e) };
    }

    post({ type: 'result', payload: { status: 'ok', a11y: a11y } });
  }

  window.addEventListener('message', function (e) {
    var data = e.data || {};
    if (data.type === 'run') run(data.code, data.componentName);
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
