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
      testCases: { componentName: c.componentName },
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
