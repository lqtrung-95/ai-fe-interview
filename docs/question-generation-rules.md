# Question Generation Rules

This document defines the exact format for every question in the question bank.
All AI-generated and hand-crafted questions **must** conform to these rules.

---

## 1. JSON Record Shape

Every question is a `SeedQuestion` object stored in `prisma/seed/questions/*.json` and upserted into the `SeedQuestion` DB table.

```ts
{
  id:                 string;            // see §2
  topic:              CanonicalTopic;    // see §3
  subtopic?:          string;            // see §4
  difficulty:         "junior"|"mid"|"senior";
  type:               "conceptual"|"debugging"|"system_design"|"behavioral"|"tradeoff";
  question:           string;            // the interview question text
  expectedPoints:     string[];          // exactly 5 short strings — see §5
  followUps:          string[];          // exactly 3 strings — see §6
  rubric:             {};                // always empty object
  tags:               string[];          // see §7
  sourceFile:         string;            // "generated-new-questions" or HTML filename
  childExplanation:   string;            // ELI5 analogy — see §8
  detailedExplanation: string;           // rich HTML — see §9  ← most complex
  diagramSvg?:        string;            // raw <svg>...</svg> — see §10
  quiz:               QuizData;          // MCQ or T/F — see §11
}
```

---

## 2. `id` Field

Format: `{source-prefix}-{topic-slug}-{question-slug}`

- All lowercase, hyphen-separated.
- Legacy questions use `fe-prep-{topic}-{slug}`.
- New LLM-generated questions use `new-prep-{kebab-key}` where `kebab-key` matches the `key` field in `generate-new-questions.ts`.
- Must be globally unique across all JSON files.
- Max ~80 chars.

Examples:
```
fe-prep-react-how-do-reconciliation-virtual-dom-and-fi
new-prep-react-suspense-concurrent
```

---

## 3. `topic` Field — Canonical Values Only

Must be exactly one of:

| Value | File |
|---|---|
| `JavaScript` | `javascript.json` |
| `React` | `react.json` |
| `Frontend System Design` | `frontend-system-design.json` |
| `Web Performance` | `web-performance.json` |
| `Browser & Web APIs` | `browser-and-web-apis.json` |
| `Testing` | `testing.json` |
| `Behavioral` | `behavioral.json` |
| `Junior` | `junior.json` |

---

## 4. `subtopic` Field

Optional. Format: `{emoji} {Short Label}` — e.g. `⚛️ Suspense & Concurrent Rendering`.

- Emoji prefix is recommended for visual hierarchy.
- Keep under 40 chars.
- Describes the specific sub-area within the topic.

---

## 5. `expectedPoints` — Exactly 5 Items

Five short strings stating what a strong answer must cover. Each string:
- One sentence, starts with a verb or noun.
- Max ~80 chars per item.
- No overlap between items.
- Ordered from fundamental to advanced.

Example:
```json
[
  "Explain the scope and lifespan of the state.",
  "Discuss performance considerations and re-rendering impacts.",
  "Consider ease of use and developer experience.",
  "Evaluate the complexity and scale of the application.",
  "Mention data consistency and synchronization needs."
]
```

---

## 6. `followUps` — Exactly 3 Items

Three natural follow-up questions an interviewer would ask after the main answer.
- Phrased as genuine interview questions.
- Each probes a distinct angle (e.g., implementation detail, edge case, trade-off).
- Max ~100 chars per item.

---

## 7. `tags` Field

Array of lowercase kebab-case strings. 3–6 tags.
- Name the concrete technologies, patterns, or concepts involved.
- Examples: `["react", "suspense", "concurrent", "useTransition"]`

---

## 8. `childExplanation` — ELI5 Analogy

**Plain text only** (no HTML). 2–3 sentences.

Rules:
- Use a concrete real-world analogy a 5-year-old would understand.
- Must map directly to the core concept (analogy → technology).
- No technical jargon in the analogy itself.
- The "punchline" sentence should make the key insight memorable.

Example pattern:
> [Everyday object/situation]. [How this maps to the technical concept]. [The key insight or punchline.]

---

## 9. `detailedExplanation` — Rich HTML

Target length: **7,000–9,000 characters**.

### 9.1 Required sections (in order)

| # | Element | Notes |
|---|---|---|
| 1 | 3–5 `<h4>` sections | Each covers a distinct technical subtopic |
| 2 | `<p>` and `<ul><li>` lists | Under each `<h4>` |
| 3 | 2+ `<pre>` code blocks | Realistic production code; HTML-entity-safe |
| 4 | `<code>` inline | For every API name, method, property |
| 5 | Specific metrics | Real numbers: latency ms, byte sizes, thresholds |
| 6 | ONE `.pitfall` div | See §9.2 |
| 7 | ONE `<blockquote>` | Starts with `Senior signal:` — nuanced insight juniors miss |
| 8 | ONE `.ladder` div | Exactly 5 `lq-item` entries — see §9.3 |

### 9.2 Pitfall div

```html
<div class="pitfall">
  <span class="label">⚠ Common Pitfall</span>
  <p>…one paragraph explaining the trap and why it matters…</p>
</div>
```

Alternatives for `label` text: `Classic Pitfall`, `Senior Mindset`, `In interviews`.

### 9.3 Deep Dive Ladder — EXACT format

The ladder must have **exactly 5 `lq-item` entries**. IDs are `lq-{prefix}-0` through `lq-{prefix}-4` where `{prefix}` is 6 hex chars derived from the question key (see `lqPrefix()` in `generate-new-questions.ts`).

```html
<div class="ladder">
  <span class="label">🪜 Deep Dive Ladder — Self-Interview</span>
  <p class="ladder-intro">Answer before expanding.</p>
  <ol class="ladder-list">
    <li class="lq-item">
      <div class="lq-row">
        <span class="ln">1</span>
        <span class="lq-text">QUESTION TEXT</span>
        <button class="lq-toggle" data-target="lq-{prefix}-0" aria-expanded="false">View Answer</button>
      </div>
      <div class="lq-ans" id="lq-{prefix}-0" hidden="">
        <div class="lq-ans-inner">ANSWER TEXT</div>
      </div>
    </li>
    <!-- repeat for indices 1, 2, 3, 4 -->
  </ol>
</div>
```

**Depth progression for the 5 items:**
1. How it works internally (mechanisms, APIs, data structures)
2. Why this design choice was made (trade-offs, alternatives)
3. Edge cases and failure modes
4. Scale or performance concerns
5. Cross-cutting concern (security, observability, team process, backward compat)

**Ladder answer quality:**
- 2–5 sentences, technically dense.
- Cite concrete mechanisms, not just "it depends."

### 9.4 Code block format

Use `<pre>` with styled `<span>` tokens matching the existing token classes used in other questions:

```html
<pre><span class="cm">// comment</span>
<span class="kw">const</span> <span class="var">x</span> = <span class="fn">doThing</span>(<span class="num">42</span>);
</pre>
```

Token classes: `cm` (comment), `kw` (keyword), `fn` (function name), `var` (variable), `num` (number literal), `str` (string).

HTML entities in code: `>` → `&gt;`  `<` → `&lt;`  `&` → `&amp;`

### 9.5 Prohibited content

- No company names (Google, Meta, Binance, etc.).
- No vague filler sentences — every sentence must carry technical signal.
- No first-person ("I would…").

---

## 10. `diagramSvg` — SVG Diagram

Generated via `DiagramSpec` → `renderDiagramSpec()` in `scripts/diagram-spec-renderer.ts`.

### 10.1 DiagramSpec JSON

```ts
interface DiagramSpec {
  direction: "LR" | "TD";
  nodes:  DiagramNode[];
  edges:  DiagramEdge[];
  groups?: DiagramGroup[];
  caption?: string;  // ≤8 words
}

interface DiagramNode {
  id:        string;         // unique, lowercase, ≤2 words joined with underscore
  label:     string;         // Title Case, MAX 2 words, MAX 14 characters total
  sublabel?: string;         // lowercase, MAX 3 words, MAX 18 characters total
  color?:    DiagramColor;
}

interface DiagramEdge {
  from:     string;          // node id
  to:       string;          // node id
  dashed?:  boolean;         // optional / weak relationships
  // NO label field — encode meaning in node sublabels instead
}

interface DiagramGroup {
  label:    string;          // MAX 2 words (rendered UPPERCASE in SVG)
  nodeIds:  string[];
  color?:   DiagramColor;
}

type DiagramColor = "teal"|"green"|"orange"|"purple"|"red"|"blue"|"pink"|"amber"|"cyan";
```

### 10.2 Direction rules

| Condition | Use |
|---|---|
| 5–9 nodes, any layout | `"TD"` (preferred) |
| Simple linear pipeline, ≤5 nodes | `"LR"` |
| More than 5 nodes | **Never** `"LR"` — always `"TD"` |

### 10.3 Node count limits

- `TD`: 5–9 nodes, arranged in a grid (3 cols × 3 rows max).
- `LR`: 3–5 nodes in a single chain.
- Absolute max: 9 nodes. Exceeding this causes overlap.

### 10.4 Label length — critical

The renderer computes node widths dynamically from label text (≈7.2 px/char at 12px).
Exceeding the limits causes nodes to overflow the 860px width budget.

| Field | Max words | Max chars | Why |
|---|---|---|---|
| `label` | 2 | 14 | Each extra char adds ~7px node width |
| `sublabel` | 3 | 18 | Smaller font but still constrained |
| `caption` | 8 | — | Rendered below diagram |
| `group.label` | 2 | — | Rendered UPPERCASE |

### 10.5 Color semantics

| Color | Use for |
|---|---|
| `teal` | Input, client, consumer |
| `blue` | API, service, external call |
| `purple` | Core logic, algorithm, scheduler |
| `orange` | Queue, buffer, staging |
| `green` | Output, success, result |
| `red` | Error, risk, failure path |
| `pink` | UI, view, presentation layer |
| `amber` | Config, settings, policy |
| `cyan` | Transport, protocol, network layer |
| *(none)* | Neutral / unclassified |

### 10.6 Groups

- Max **2 groups**.
- A group must describe a real sub-system boundary — never wrap all nodes into one group.
- Group `label` is rendered in UPPERCASE inside the SVG.
- **Anti-overlap rule (critical):** Each group's `nodeIds` must belong to a single sub-tree branch. The renderer computes group bounding boxes from actual node pixel positions — if two groups share nodes at the same depth row, their bounding boxes will physically overlap in the SVG.
  - ✅ Correct: `group1 = [left_root, left_child_a, left_child_b]` / `group2 = [right_root, right_child_a, right_child_b]`
  - ❌ Wrong: `group1 = [depth0_node, depth1_left]` / `group2 = [depth0_node, depth1_right]` — same top row = guaranteed overlap
- **Fallback:** If a layout cannot avoid overlapping groups, **omit groups entirely**. Color-coded nodes already convey semantic grouping; groups are decorative.

### 10.7 SVG dimension budget

The rendered SVG **must not exceed 860px wide × 480px tall**.

Causes of overflow:
- Labels too long (see §10.4).
- Too many nodes for the chosen direction.
- Too many depth levels in `TD` (each row adds ~112px).

### 10.8 Visibility rules — no collapsed or clustered parts

Every element in the diagram must be clearly readable:

- **No overlapping nodes**: ensure the node count and direction satisfy §10.2–10.3.
- **No overlapping edges**: if two nodes at the same depth connect to the same target, the bezier curves separate naturally — do not add extra nodes just to route edges.
- **No text clipping**: every label must fit inside its node rect. Keep labels ≤14 chars.
- **No invisible sublabels**: sublabels render at 9.5px. If they push the SVG height past 480px, remove them and encode the meaning in the main label instead.
- **Groups must not collide**: if two groups share edge-adjacent nodes, ensure their `nodeIds` are disjoint and the bounding rects don't overlap.
- **Minimum spacing**: the renderer uses 16px vertical gap and 48px horizontal gap between nodes. Don't add so many nodes per row that gaps shrink to zero.

---

## 11. `quiz` — Interactive Quick-Check

### MCQ format (preferred)

```json
{
  "format": "mcq",
  "question": "What is the primary role of Fiber in React?",
  "options": [
    "To replace the Virtual DOM",
    "To improve rendering performance",
    "To manage component state",
    "To handle user inputs"
  ],
  "answer": 1,
  "explanation": "Fiber improves rendering performance by breaking tasks into units and allowing React to pause and resume work."
}
```

- Exactly **4 options**.
- `answer` is the **0-indexed** correct option.
- `explanation` is 1–2 sentences stating why the answer is correct (not just restating it).
- Distractors must be plausible — no obviously wrong options.

### True/False format

```json
{
  "format": "tf",
  "question": "A React component only re-renders when its state changes.",
  "options": ["True", "False"],
  "answer": 1,
  "explanation": "A React component re-renders when its state or props change."
}
```

- `options` must be exactly `["True", "False"]`.
- Prefer MCQ over T/F — T/F is for simple factual checks only.

---

## 12. Checklist Before Saving a Question

Use this checklist to verify a new question before writing it to the JSON file or DB.

### Content
- [ ] `id` is globally unique and follows the naming convention
- [ ] `topic` is a canonical value (see §3)
- [ ] `expectedPoints` has exactly 5 items
- [ ] `followUps` has exactly 3 items
- [ ] `childExplanation` is plain text, 2–3 sentences, uses a real-world analogy
- [ ] `detailedExplanation` is 7,000–9,000 chars
- [ ] `detailedExplanation` has 3–5 `<h4>` sections
- [ ] `detailedExplanation` has 2+ `<pre>` code blocks with HTML-entity-safe code
- [ ] `detailedExplanation` has exactly ONE `.pitfall` div
- [ ] `detailedExplanation` has exactly ONE `<blockquote>` with "Senior signal:"
- [ ] `detailedExplanation` has exactly ONE `.ladder` div with EXACTLY 5 `lq-item` entries
- [ ] Ladder item IDs are unique: `lq-{prefix}-0` through `lq-{prefix}-4`
- [ ] No company names in the content

### Diagram
- [ ] `diagramSvg` is present (never leave it null for published questions)
- [ ] Direction follows §10.2 rules (TD unless simple linear ≤5 nodes)
- [ ] Node count is within limits for the chosen direction
- [ ] All labels are ≤14 chars, sublabels ≤18 chars
- [ ] No more than 2 groups; no group wraps all nodes
- [ ] Rendered SVG is ≤860px wide and ≤480px tall
- [ ] All nodes, labels, and edges are visible and non-overlapping

### Quiz
- [ ] MCQ has exactly 4 options; T/F has exactly ["True","False"]
- [ ] `answer` is 0-indexed
- [ ] `explanation` explains *why* the answer is correct

---

## 13. File placement

| Topic | Seed JSON file |
|---|---|
| JavaScript | `prisma/seed/questions/javascript.json` |
| React | `prisma/seed/questions/react.json` |
| Frontend System Design | `prisma/seed/questions/frontend-system-design.json` |
| Web Performance | `prisma/seed/questions/web-performance.json` |
| Browser & Web APIs | `prisma/seed/questions/browser-and-web-apis.json` |
| Testing | `prisma/seed/questions/testing.json` |
| Behavioral | `prisma/seed/questions/behavioral.json` |
| Junior | `prisma/seed/questions/junior.json` |

After updating a seed JSON file, sync to DB:
```bash
pnpm generate:diagrams-new   # if diagrams are missing
pnpm db:seed                 # sync JSON → database
```
