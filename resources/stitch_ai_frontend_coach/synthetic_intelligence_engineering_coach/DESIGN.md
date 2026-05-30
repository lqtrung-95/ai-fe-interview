---
name: Synthetic Intelligence Engineering Coach
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  error-rose: '#F43F5E'
  surface-charcoal: '#1E293B'
  border-slate: '#334155'
  terminal-black: '#020617'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-base:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  code-base:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '450'
    lineHeight: '1.6'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '450'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for the high-stakes environment of technical interviews. It adopts a **Modern Corporate** aesthetic with **Glassmorphic** accents, specifically tailored for frontend engineers who appreciate clean, developer-centric interfaces. 

The brand personality is authoritative yet supportive—acting as a silent, high-performance partner in the user's career growth. The UI prioritizes deep focus through a sophisticated dark-leaning theme that minimizes cognitive load. Visual interest is maintained through subtle translucent layers and high-precision typography that mirrors a modern IDE environment.

## Colors
The palette is rooted in a "Deep Slate" spectrum to ensure long-form coding sessions remain comfortable. 

- **Primary (Action Blue):** Reserved for primary calls-to-action, active states, and focus indicators.
- **Success (Emerald):** Used for "Passed" status, high scores, and completed modules.
- **Warning/Error (Amber/Rose):** Utilized sparingly for critical feedback, syntax errors, and time-limit warnings.
- **Neutral (Slate/Charcoal):** Provides the structural foundation. Backgrounds use `terminal-black` for the primary canvas, with `surface-charcoal` used for elevated cards and containers.

## Typography
The system employs **Geist** for all UI-related text to provide a sharp, technical feel that remains highly legible. **JetBrains Mono** is used for all code snippets, technical metrics, and data labels to distinguish "content" from "logic."

- **Headlines:** Use a tighter letter-spacing for a modern, impactful look.
- **Body:** Standardized for maximum readability in technical documentation.
- **Labels:** Use monospace for meta-data (e.g., "DIFFICULTY: HARD", "TIME: 12:04") to evoke the feeling of a terminal or hardware interface.

## Layout & Spacing
This design system utilizes a **12-column Fluid Grid** for desktop and a **1-column stack** for mobile. The spacing rhythm is based on a 4px baseline, adhering to Tailwind CSS v4 conventions.

- **Desktop:** 12 columns with 24px gutters. Content is centered with a max-width of 1280px.
- **Tablet:** 8 columns with 20px gutters.
- **Mobile:** Single column with 16px horizontal margins.
- **Reflow Rules:** Complex dashboards (e.g., Code Editor + AI Chat) should stack vertically on screens smaller than 768px, giving priority to the editor.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

- **Level 1 (Base):** `terminal-black` (#020617).
- **Level 2 (Cards/Panels):** `surface-charcoal` (#1E293B) with a 1px border of `border-slate` at 50% opacity.
- **Level 3 (Modals/Overlays):** `surface-charcoal` with a `backdrop-filter: blur(12px)` and a subtle "low-opacity glow" (#3B82F6 at 10%) on the top border to simulate a light source from above.
- **Inner Glows:** Interactive elements like buttons and active input fields use a subtle inner-shadow to appear recessed or "etched" into the UI.

## Shapes
The shape language is primarily defined by `rounded-2xl` (1rem / 16px) for major containers and cards to soften the high-tech aesthetic and make it more approachable.

- **Buttons & Inputs:** Use a standard `rounded-lg` (0.5rem / 8px).
- **Code Blocks:** Use `rounded-xl` (0.75rem / 12px) to differentiate them from the main page containers.
- **Status Pills:** Use fully rounded (pill-shaped) borders for high-glanceability.

## Components
- **Buttons:** Primary buttons use a solid `#3B82F6` background with white text. Secondary buttons use an "Outline" style with a `border-slate` and a hover state that introduces a 10% primary blue tint.
- **Input Fields:** Dark background (#020617), 1px slate border, and a blue `ring-2` focus state. Labels should always be in `label-caps` (JetBrains Mono).
- **Cards:** Use `rounded-2xl`, `surface-charcoal` background, and a subtle border. For "Scoring Cards," use a 1-5 dot-scale (segmented progress bars) in `primary-blue` for active segments and `slate-700` for empty.
- **Chips:** Small, pill-shaped markers for tags (e.g., "React," "Closures"). Use a low-saturation background of the primary color with high-contrast text.
- **AI Chat Bubbles:** Glassmorphic backgrounds for AI responses; solid slate backgrounds for user inputs.
- **Code Editor:** Integrated theme matching `terminal-black` with syntax highlighting that uses the brand's secondary, tertiary, and rose colors.