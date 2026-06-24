/**
 * Seeds 'component' coding challenges — React UI builds graded client-side with
 * axe-core in a sandboxed iframe ("Build & Critique"). Run: pnpm seed:components
 *
 * Requires the CodingChallenge.kind column (migration add_coding_challenge_kind).
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// Declarative functional check, evaluated against the live render in the sandbox.
type Check = {
  id: string;
  label: string;
  selector: string;
  minCount?: number;
  exists?: boolean;
  everyHasAttr?: string;
};

type ComponentChallenge = {
  id: string;
  title: string;
  description: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  tags: string[];
  hints: string[];
  componentName: string;
  starterCode: string;
  solution: string;
  checks?: Check[];
};

const challenges: ComponentChallenge[] = [
  {
    id: 'cc-star-rating',
    title: 'Accessible Star Rating',
    difficulty: 'mid',
    topic: 'React',
    tags: ['accessibility', 'components', 'state'],
    componentName: 'StarRating',
    description: `## Accessible Star Rating

Build a **5-star rating** component named \`StarRating\`.

**Requirements**
- Render 5 stars; clicking a star sets the rating to that value (1–5).
- The current rating is visually indicated (filled vs empty stars).
- It must be **usable with a keyboard** and **understandable to a screen reader** —
  each control needs an accessible name, and the group should announce the current value.

The starter renders fine visually, but the live accessibility audit will flag real
issues. Fix them, then submit for a senior critique.

> The component takes no props — manage the rating with internal state.`,
    hints: [
      'Icon-only buttons have no accessible name. An aria-label like "Rate 3 stars" fixes that.',
      'A radio group (role="radiogroup" + role="radio" with aria-checked) models "pick one of five" well.',
      'Arrow keys moving between options is what a screen-reader user expects from a rating widget.',
    ],
    // Starter: visually correct, but each star is an icon-only <button> with no
    // accessible name → axe flags "button-name". A genuine, fixable a11y gap.
    starterCode: `function StarRating() {
  const [rating, setRating] = React.useState(0);

  function Star({ filled }) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : '#d1d5db'}>
        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </svg>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <Star filled={star <= rating} />
        </button>
      ))}
    </div>
  );
}`,
    // Reference solution: accessible names, radiogroup semantics, keyboard support.
    solution: `function StarRating() {
  const [rating, setRating] = React.useState(0);

  function Star({ filled }) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : '#d1d5db'} aria-hidden="true">
        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </svg>
    );
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setRating((r) => Math.min(5, r + 1));
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setRating((r) => Math.max(1, r - 1));
  }

  return (
    <div role="radiogroup" aria-label="Star rating" style={{ display: 'flex', gap: 4 }} onKeyDown={onKeyDown}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={\`Rate \${star} star\${star > 1 ? 's' : ''}\`}
          onClick={() => setRating(star)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <Star filled={star <= rating} />
        </button>
      ))}
    </div>
  );
}`,
    checks: [
      { id: 'five-stars', label: 'Renders 5 rating controls', selector: 'button, [role="radio"]', minCount: 5 },
    ],
  },

  {
    id: 'cc-toggle-switch',
    title: 'Accessible Toggle Switch',
    difficulty: 'junior',
    topic: 'React',
    tags: ['accessibility', 'forms', 'state'],
    componentName: 'ToggleSwitch',
    description: `## Accessible Toggle Switch

Build a \`ToggleSwitch\` that turns a setting on and off.

**Requirements**
- A control the user can toggle between on and off.
- The control must have an **accessible name** so a screen reader announces what it controls.
- Keep the current state visible.

The starter works with a mouse, but the live audit will flag a real labelling issue.

> The component takes no props — manage the state internally.`,
    hints: [
      'A placeholder or an adjacent <span> is not a programmatic label.',
      'Associate the text with the control: wrap both in a <label>, or use htmlFor + id, or aria-label.',
    ],
    // Gap: the checkbox has no associated label → axe "label" violation.
    starterCode: `function ToggleSwitch() {
  const [on, setOn] = React.useState(false);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        style={{ width: 18, height: 18 }}
      />
      <span>Dark mode</span>
    </span>
  );
}`,
    solution: `function ToggleSwitch() {
  const [on, setOn] = React.useState(false);

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        style={{ width: 18, height: 18 }}
      />
      <span>Dark mode</span>
    </label>
  );
}`,
  },

  {
    id: 'cc-profile-card',
    title: 'Accessible Profile Card',
    difficulty: 'junior',
    topic: 'React',
    tags: ['accessibility', 'components', 'images'],
    componentName: 'ProfileCard',
    description: `## Accessible Profile Card

Build a \`ProfileCard\` that shows a person's avatar, name, and role.

**Requirements**
- Show the avatar image alongside the name and role.
- Make sure the avatar is **meaningful to a screen reader** — not just sighted users.

The card looks right, but the audit will catch what's missing.

> The component takes no props — hardcode the example person.`,
    hints: [
      'Every <img> needs an alt attribute. For a meaningful avatar, describe who it is.',
      'A purely decorative image takes alt="" — but this avatar conveys identity.',
    ],
    // Gap: <img> with no alt → axe "image-alt" violation.
    starterCode: `function ProfileCard() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, width: 240 }}>
      <img
        src="https://i.pravatar.cc/96?img=12"
        width={48}
        height={48}
        style={{ borderRadius: '50%' }}
      />
      <div>
        <div style={{ fontWeight: 600 }}>Ada Lovelace</div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>Frontend Engineer</div>
      </div>
    </div>
  );
}`,
    solution: `function ProfileCard() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, width: 240 }}>
      <img
        src="https://i.pravatar.cc/96?img=12"
        alt="Ada Lovelace"
        width={48}
        height={48}
        style={{ borderRadius: '50%' }}
      />
      <div>
        <div style={{ fontWeight: 600 }}>Ada Lovelace</div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>Frontend Engineer</div>
      </div>
    </div>
  );
}`,
  },

  {
    id: 'cc-search-box',
    title: 'Accessible Search Box',
    difficulty: 'mid',
    topic: 'React',
    tags: ['accessibility', 'forms', 'components'],
    componentName: 'SearchBox',
    description: `## Accessible Search Box

Build a \`SearchBox\` — a text field with an icon-only submit button.

**Requirements**
- A text input the user types a query into.
- A submit button with a search icon.
- Both controls must be **named for assistive tech** — a placeholder and an icon are not enough.

The audit will flag two real issues here. Fix both.

> The component takes no props — manage the query with internal state.`,
    hints: [
      'A placeholder is not a label — give the input an accessible name (aria-label or a <label>).',
      'An icon-only button has no text content, so it needs aria-label.',
    ],
    // Gaps: input has no label (placeholder ≠ label) AND the icon-only button has
    // no accessible name → axe "label" + "button-name" violations.
    starterCode: `function SearchBox() {
  const [q, setQ] = React.useState('');

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 6 }}>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
      />
      <button type="submit" style={{ padding: 8, border: 'none', background: '#4f46e5', borderRadius: 6, cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
    </form>
  );
}`,
    solution: `function SearchBox() {
  const [q, setQ] = React.useState('');

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 6 }}>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        aria-label="Search"
        style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
      />
      <button type="submit" aria-label="Search" style={{ padding: 8, border: 'none', background: '#4f46e5', borderRadius: 6, cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
    </form>
  );
}`,
  },

  {
    id: 'cc-icon-toolbar',
    title: 'Accessible Formatting Toolbar',
    difficulty: 'junior',
    topic: 'React',
    tags: ['accessibility', 'components', 'state'],
    componentName: 'TextToolbar',
    description: `## Accessible Formatting Toolbar

Build a \`TextToolbar\` with bold, italic, and underline toggle buttons.

**Requirements**
- Three toggle buttons; clicking one toggles its active state.
- Each button must be **named for assistive tech** and expose its pressed state.

The glyphs are hidden from screen readers (as icon fonts usually are), so the
buttons currently have no accessible name. The audit will catch it.

> The component takes no props.`,
    hints: [
      'A button whose only content is aria-hidden has no accessible name — add aria-label.',
      'A toggle button should report state with aria-pressed.',
    ],
    checks: [
      { id: 'three-buttons', label: 'Renders three toolbar buttons', selector: 'button', minCount: 3 },
    ],
    starterCode: `function TextToolbar() {
  const [active, setActive] = React.useState({ bold: false, italic: false, underline: false });
  const toggle = (k) => setActive((s) => ({ ...s, [k]: !s[k] }));
  const items = [['bold', 'B'], ['italic', 'I'], ['underline', 'U']];

  return (
    <div role="toolbar" style={{ display: 'flex', gap: 6 }}>
      {items.map(([k, label]) => (
        <button
          key={k}
          onClick={() => toggle(k)}
          style={{ width: 36, height: 36, borderRadius: 6, cursor: 'pointer', border: '1px solid #cbd5e1', background: active[k] ? '#e0e7ff' : '#fff' }}
        >
          <span aria-hidden="true" style={{ fontWeight: 700 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}`,
    solution: `function TextToolbar() {
  const [active, setActive] = React.useState({ bold: false, italic: false, underline: false });
  const toggle = (k) => setActive((s) => ({ ...s, [k]: !s[k] }));
  const items = [['bold', 'B', 'Bold'], ['italic', 'I', 'Italic'], ['underline', 'U', 'Underline']];

  return (
    <div role="toolbar" aria-label="Text formatting" style={{ display: 'flex', gap: 6 }}>
      {items.map(([k, label, name]) => (
        <button
          key={k}
          type="button"
          aria-label={name}
          aria-pressed={active[k]}
          onClick={() => toggle(k)}
          style={{ width: 36, height: 36, borderRadius: 6, cursor: 'pointer', border: '1px solid #cbd5e1', background: active[k] ? '#e0e7ff' : '#fff' }}
        >
          <span aria-hidden="true" style={{ fontWeight: 700 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}`,
  },

  {
    id: 'cc-social-links',
    title: 'Accessible Social Links',
    difficulty: 'junior',
    topic: 'React',
    tags: ['accessibility', 'components'],
    componentName: 'SocialLinks',
    description: `## Accessible Social Links

Build a \`SocialLinks\` row of icon-only links (X, GitHub, LinkedIn).

**Requirements**
- Three links, each pointing somewhere.
- Each link must have an **accessible name** — an icon alone tells a screen reader nothing.

> The component takes no props.`,
    hints: [
      'An icon-only link has no text, so screen readers announce nothing useful.',
      'Give each <a> an aria-label describing where it goes.',
    ],
    checks: [
      { id: 'three-links', label: 'Renders three links', selector: 'a', minCount: 3 },
    ],
    starterCode: `function SocialLinks() {
  const links = [
    { id: 'x', glyph: 'X', href: 'https://x.com' },
    { id: 'gh', glyph: 'GH', href: 'https://github.com' },
    { id: 'in', glyph: 'in', href: 'https://linkedin.com' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {links.map((l) => (
        <a
          key={l.id}
          href={l.href}
          style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', borderRadius: 8, textDecoration: 'none', color: '#111' }}
        >
          <span aria-hidden="true">{l.glyph}</span>
        </a>
      ))}
    </div>
  );
}`,
    solution: `function SocialLinks() {
  const links = [
    { id: 'x', glyph: 'X', href: 'https://x.com', name: 'X (Twitter)' },
    { id: 'gh', glyph: 'GH', href: 'https://github.com', name: 'GitHub' },
    { id: 'in', glyph: 'in', href: 'https://linkedin.com', name: 'LinkedIn' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {links.map((l) => (
        <a
          key={l.id}
          href={l.href}
          aria-label={l.name}
          style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', borderRadius: 8, textDecoration: 'none', color: '#111' }}
        >
          <span aria-hidden="true">{l.glyph}</span>
        </a>
      ))}
    </div>
  );
}`,
  },

  {
    id: 'cc-alert-banner',
    title: 'Readable Alert Banner',
    difficulty: 'junior',
    topic: 'React',
    tags: ['accessibility', 'color-contrast'],
    componentName: 'AlertBanner',
    description: `## Readable Alert Banner

Build an \`AlertBanner\` that shows a short notice.

**Requirements**
- Display the message clearly.
- Text must meet **WCAG AA color contrast** (≥ 4.5:1 against its background).

The starter uses a light grey that fails contrast — the audit measures it.

> The component takes no props.`,
    hints: [
      'Light grey on white is pretty, but unreadable for many users.',
      'Darken the text until it passes 4.5:1 (axe reports the exact ratio).',
    ],
    starterCode: `function AlertBanner() {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, width: 280 }}>
      <p style={{ margin: 0, color: '#cbd5e1' }}>Heads up — your free trial ends in 3 days.</p>
    </div>
  );
}`,
    solution: `function AlertBanner() {
  return (
    <div role="status" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, width: 280 }}>
      <p style={{ margin: 0, color: '#374151' }}>Heads up — your free trial ends in 3 days.</p>
    </div>
  );
}`,
  },

  {
    id: 'cc-login-form',
    title: 'Accessible Login Form',
    difficulty: 'junior',
    topic: 'React',
    tags: ['accessibility', 'forms', 'state'],
    componentName: 'LoginForm',
    description: `## Accessible Login Form

Build a \`LoginForm\` with email and password fields and a submit button.

**Requirements**
- Email and password inputs, plus a submit button.
- Every field must have a **real label** (a placeholder is not a label).

> The component takes no props — manage the values with internal state.`,
    hints: [
      'Placeholders disappear on input and are not exposed as labels.',
      'Use a <label> (wrap or htmlFor + id) or aria-label for each field.',
    ],
    checks: [
      { id: 'two-inputs', label: 'Renders two input fields', selector: 'input', minCount: 2 },
      { id: 'submit', label: 'Has a submit button', selector: 'button[type="submit"], button', minCount: 1 },
    ],
    starterCode: `function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: 10, width: 240 }}>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
      <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
      <button type="submit" style={{ padding: 8, border: 'none', background: '#4f46e5', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Sign in</button>
    </form>
  );
}`,
    solution: `function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: 10, width: 240 }}>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Password
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
      </label>
      <button type="submit" style={{ padding: 8, border: 'none', background: '#4f46e5', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Sign in</button>
    </form>
  );
}`,
  },

  {
    id: 'cc-quantity-stepper',
    title: 'Accessible Quantity Stepper',
    difficulty: 'mid',
    topic: 'React',
    tags: ['accessibility', 'components', 'state'],
    componentName: 'QuantityStepper',
    description: `## Accessible Quantity Stepper

Build a \`QuantityStepper\` with minus and plus buttons around a quantity.

**Requirements**
- Decrement and increment buttons; quantity never drops below 1.
- Both icon buttons must have an **accessible name**.

> The component takes no props.`,
    hints: [
      'The − and + glyphs are aria-hidden, so the buttons are unnamed.',
      'aria-label="Decrease quantity" / "Increase quantity" makes intent clear.',
    ],
    checks: [
      { id: 'two-buttons', label: 'Renders increment and decrement buttons', selector: 'button', minCount: 2 },
    ],
    starterCode: `function QuantityStepper() {
  const [qty, setQty] = React.useState(1);
  const s = { width: 32, height: 32, border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 18 };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={s}><span aria-hidden="true">−</span></button>
      <span style={{ minWidth: 24, textAlign: 'center' }}>{qty}</span>
      <button onClick={() => setQty((q) => q + 1)} style={s}><span aria-hidden="true">+</span></button>
    </div>
  );
}`,
    solution: `function QuantityStepper() {
  const [qty, setQty] = React.useState(1);
  const s = { width: 32, height: 32, border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 18 };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} style={s}><span aria-hidden="true">−</span></button>
      <span aria-live="polite" style={{ minWidth: 24, textAlign: 'center' }}>{qty}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)} style={s}><span aria-hidden="true">+</span></button>
    </div>
  );
}`,
  },

  {
    id: 'cc-modal-dialog',
    title: 'Accessible Modal Dialog',
    difficulty: 'mid',
    topic: 'React',
    tags: ['accessibility', 'components', 'state'],
    componentName: 'Modal',
    description: `## Accessible Modal Dialog

Build a \`Modal\` confirm dialog (it renders open).

**Requirements**
- An icon-only close button, a title, a message, and a confirm action.
- The close button needs an **accessible name**.
- Bonus the AI will check: dialog semantics (\`role="dialog"\`, \`aria-modal\`,
  \`aria-labelledby\`) and focus management — things automated checks miss.

> The component takes no props.`,
    hints: [
      'The × is aria-hidden, so the close button is unnamed — add aria-label="Close".',
      'A real dialog uses role="dialog" aria-modal and labels itself via aria-labelledby.',
      'Focus should move into the dialog and be trapped while it is open.',
    ],
    checks: [
      { id: 'close-and-confirm', label: 'Renders close and confirm controls', selector: 'button', minCount: 2 },
    ],
    starterCode: `function Modal() {
  const [open, setOpen] = React.useState(true);
  if (!open) return <button onClick={() => setOpen(true)}>Open dialog</button>;

  return (
    <div style={{ position: 'relative', width: 300, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}>
      <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 8, right: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}>
        <span aria-hidden="true">×</span>
      </button>
      <h3 style={{ margin: '0 0 8px' }}>Delete item?</h3>
      <p style={{ margin: '0 0 14px', color: '#6b7280' }}>This action cannot be undone.</p>
      <button style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
    </div>
  );
}`,
    solution: `function Modal() {
  const [open, setOpen] = React.useState(true);
  const titleId = 'modal-title';
  if (!open) return <button onClick={() => setOpen(true)}>Open dialog</button>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ position: 'relative', width: 300, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}
    >
      <button aria-label="Close" onClick={() => setOpen(false)} style={{ position: 'absolute', top: 8, right: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}>
        <span aria-hidden="true">×</span>
      </button>
      <h3 id={titleId} style={{ margin: '0 0 8px' }}>Delete item?</h3>
      <p style={{ margin: '0 0 14px', color: '#6b7280' }}>This action cannot be undone.</p>
      <button style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
    </div>
  );
}`,
  },

  {
    id: 'cc-progress-bar',
    title: 'Accessible Progress Bar',
    difficulty: 'mid',
    topic: 'React',
    tags: ['accessibility', 'aria', 'components'],
    componentName: 'ProgressBar',
    description: `## Accessible Progress Bar

Build a \`ProgressBar\` that visualises an upload at 65%.

**Requirements**
- A visual bar filled to the current percentage.
- It must expose its value to assistive tech via the **progressbar role's
  required ARIA attributes**.

> The component takes no props — hardcode 65%.`,
    hints: [
      'role="progressbar" requires aria-valuenow, aria-valuemin, and aria-valuemax.',
      'Give it an aria-label too, so its purpose is announced.',
    ],
    checks: [
      { id: 'has-progressbar', label: 'Has an element with role="progressbar"', selector: '[role="progressbar"]', exists: true },
    ],
    starterCode: `function ProgressBar() {
  const pct = 65;
  return (
    <div style={{ width: 240 }}>
      <div style={{ marginBottom: 4, fontSize: 13 }}>Uploading… {pct}%</div>
      <div role="progressbar" style={{ height: 10, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: '#4f46e5' }} />
      </div>
    </div>
  );
}`,
    solution: `function ProgressBar() {
  const pct = 65;
  return (
    <div style={{ width: 240 }}>
      <div style={{ marginBottom: 4, fontSize: 13 }}>Uploading… {pct}%</div>
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: 10, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}
      >
        <div style={{ width: pct + '%', height: '100%', background: '#4f46e5' }} />
      </div>
    </div>
  );
}`,
  },

  {
    id: 'cc-tabs',
    title: 'Accessible Tabs',
    difficulty: 'senior',
    topic: 'React',
    tags: ['accessibility', 'components', 'state'],
    componentName: 'Tabs',
    description: `## Accessible Tabs

Build a \`Tabs\` component with three tabs that switch the panel below.

**Requirements**
- Clicking a tab shows its panel.
- Use the **WAI-ARIA tabs pattern**: \`role="tablist"\`, \`role="tab"\` with
  \`aria-selected\`, \`role="tabpanel"\`, and arrow-key navigation between tabs.

> Heads up: automated checks may pass even when the semantics are missing — this
> is exactly where the AI critique earns its keep. Build it properly.`,
    hints: [
      'A row of <button>s that swaps content is not yet "tabs" to a screen reader.',
      'Wire role="tablist" / role="tab" (aria-selected) / role="tabpanel", and Left/Right arrow keys.',
    ],
    checks: [
      { id: 'three-tabs', label: 'Renders three tabs', selector: 'button, [role="tab"]', minCount: 3 },
    ],
    starterCode: `function Tabs() {
  const tabs = ['Overview', 'Pricing', 'Reviews'];
  const [active, setActive] = React.useState(0);

  return (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActive(i)}
            style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: active === i ? 600 : 400, borderBottom: active === i ? '2px solid #4f46e5' : '2px solid transparent' }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: 12 }}>Content for {tabs[active]}</div>
    </div>
  );
}`,
    solution: `function Tabs() {
  const tabs = ['Overview', 'Pricing', 'Reviews'];
  const [active, setActive] = React.useState(0);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') setActive((i) => (i + 1) % tabs.length);
    if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + tabs.length) % tabs.length);
  }

  return (
    <div style={{ width: 320 }}>
      <div role="tablist" aria-label="Sections" onKeyDown={onKeyDown} style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((t, i) => (
          <button
            key={t}
            role="tab"
            id={'tab-' + i}
            aria-selected={active === i}
            aria-controls={'panel-' + i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: active === i ? 600 : 400, borderBottom: active === i ? '2px solid #4f46e5' : '2px solid transparent' }}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={'panel-' + active} aria-labelledby={'tab-' + active} style={{ padding: 12 }}>
        Content for {tabs[active]}
      </div>
    </div>
  );
}`,
  },
];

async function main() {
  for (const c of challenges) {
    const data = {
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      topic: c.topic,
      tags: c.tags,
      kind: 'component',
      starterCode: c.starterCode,
      // For component challenges, testCases holds the component spec.
      testCases: { componentName: c.componentName, checks: c.checks ?? [] },
      hints: c.hints,
      solution: c.solution,
      timeLimit: 5000,
    };
    await prisma.codingChallenge.upsert({
      where: { id: c.id },
      create: { id: c.id, ...data },
      update: data,
    });
    console.log(`✓ seeded component challenge: ${c.id}`);
  }
}

main()
  .then(() => console.log(`Done — ${challenges.length} component challenge(s).`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
