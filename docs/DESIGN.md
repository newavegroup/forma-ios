# Forma: Design System

This document defines the visual and interaction foundation for Forma. Every screen, component, and state must reference only the tokens and patterns defined here. It is meant to be ingested alongside the PRD and the Design Plan.

## Aesthetic Direction

**Dark, athletic, data as hero.** Inspired by Whoop, but with sharper typography and more restraint. The product is a cockpit for a hybrid athlete, not a wellness brand.

Five principles:

1. **Dark mode only in v1.** Deep near-black background, never pure black, lets charts and data glow without eye strain.
2. **One accent color, used surgically.** Everything is monochromatic except for state (the accent color signals "this is live, this is now, this matters"). No gradient backgrounds, no rainbow palettes.
3. **Typography does the heavy lifting.** A sharp display font for numbers and headlines, a refined sans for body. Weight and size carry hierarchy, not color.
4. **Density over decoration.** Whitespace is earned. Charts are large, numbers are large, and there are no decorative icons.
5. **Motion is diagnostic, not decorative.** Animations communicate state change (a target is hit, a log is confirmed, a plan is regenerated). No floating particles, no hover flourishes, no loading spinners for their own sake.

## Tokens

### Color

All colors are defined as CSS custom properties. Dark theme is the default.

**Backgrounds**
- `--bg-canvas: #0A0B0D` (primary app background, near-black with a hint of blue)
- `--bg-surface: #14161A` (cards, panels, elevated content)
- `--bg-surface-elevated: #1C1F24` (modals, dropdowns, higher elevation)
- `--bg-subtle: #1F2228` (input fields, pressed states)

**Foregrounds (text and icons)**
- `--fg-primary: #F5F6F7` (headlines, primary numbers)
- `--fg-secondary: #A8ADB6` (body text, labels)
- `--fg-tertiary: #6B7280` (metadata, timestamps, captions)
- `--fg-disabled: #3A3F47`

**Accent (single color, used for live state and primary actions only)**
- `--accent: #D4FF3A` (high-visibility chartreuse, reads as "energy" on dark bg)
- `--accent-muted: #8AA328` (hover/pressed states for accent)
- `--accent-dim: rgba(212, 255, 58, 0.12)` (accent backgrounds, highlights)

**Semantic (state only, used sparingly)**
- `--success: #5EE49E` (target hit, scan uploaded, logged successfully)
- `--warning: #F5B841` (target drift, under-eating flagged by coach)
- `--danger: #F56565` (significant deficit, error, failed upload)

**Borders and dividers**
- `--border-subtle: rgba(255, 255, 255, 0.06)`
- `--border-default: rgba(255, 255, 255, 0.10)`
- `--border-strong: rgba(255, 255, 255, 0.18)`

### Typography

Two fonts. Both loaded from Google Fonts, both self-hosted in production.

**Display: Space Grotesk** (or alternative: Neue Haas Grotesk Display if budget allows for a licensed font)
- Used for: large numbers, screen headlines, hero data (macro values, weight, body fat percent)
- Weights loaded: 500 (Medium), 700 (Bold)
- Tracking: -0.02em on large sizes, -0.01em on smaller display use

**Body: Inter** (refined sans, widely available, excellent numerics)
- Used for: body text, labels, buttons, navigation
- Weights loaded: 400 (Regular), 500 (Medium), 600 (Semibold)
- Use tabular-nums for any running macro totals so digits do not jitter

**Type scale**
- `--text-display-xl: 72px / 1.0 / -0.03em` (hero numbers, scan comparison)
- `--text-display-l: 48px / 1.05 / -0.02em` (screen headlines, today's total calories)
- `--text-display-m: 32px / 1.1 / -0.02em` (section headlines, per-macro totals)
- `--text-body-l: 18px / 1.5` (featured body, coach responses)
- `--text-body-m: 15px / 1.5` (default body)
- `--text-body-s: 13px / 1.45` (labels, metadata)
- `--text-caption: 11px / 1.4 / 0.04em` (uppercase labels, units, chart axes)

### Spacing

Eight-point system, everything in multiples of 4.

- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 24px`
- `--space-6: 32px`
- `--space-7: 48px`
- `--space-8: 64px`
- `--space-9: 96px`

### Radius

- `--radius-sm: 6px` (buttons, inputs)
- `--radius-md: 10px` (cards, panels)
- `--radius-lg: 16px` (modals, major surfaces)
- `--radius-full: 9999px` (pills, progress indicators)

### Elevation

Shadows are subtle. Dark UI relies on background contrast more than shadows.

- `--elev-0: none`
- `--elev-1: 0 1px 2px rgba(0, 0, 0, 0.4)` (resting cards)
- `--elev-2: 0 4px 12px rgba(0, 0, 0, 0.5)` (dropdowns, tooltips)
- `--elev-3: 0 12px 32px rgba(0, 0, 0, 0.6)` (modals)

### Motion

- `--motion-fast: 120ms cubic-bezier(0.2, 0, 0, 1)` (button press, input focus)
- `--motion-medium: 240ms cubic-bezier(0.2, 0, 0, 1)` (state change, card expand)
- `--motion-slow: 480ms cubic-bezier(0.2, 0, 0, 1)` (page transitions, hero reveals)

Reduced motion: all animations respect `prefers-reduced-motion: reduce` and fall back to opacity-only transitions.

## Components

### Primary Button

- Background: `--accent`, text `--bg-canvas` (inverted, readable on chartreuse)
- Padding: `--space-3` vertical, `--space-5` horizontal
- Border radius: `--radius-sm`
- Font: Inter Semibold, `--text-body-m`
- Hover: `--accent-muted` background, `--motion-fast` transition
- Disabled: `--fg-disabled` background, `--fg-tertiary` text

### Secondary Button

- Background: transparent
- Border: 1px solid `--border-default`
- Text: `--fg-primary`
- Hover: border becomes `--border-strong`, background `--bg-subtle`

### Tertiary Button (text only)

- Text: `--fg-secondary`
- Hover: `--fg-primary`
- Used for destructive-adjacent or low-priority actions (edit, cancel)

### Input (text and textarea)

- Background: `--bg-subtle`
- Border: 1px solid `--border-subtle`
- Text: `--fg-primary`
- Placeholder: `--fg-tertiary`
- Focus: border becomes `--accent`, `--motion-fast` transition
- Padding: `--space-3` vertical, `--space-4` horizontal
- Border radius: `--radius-sm`

### Card

- Background: `--bg-surface`
- Border: 1px solid `--border-subtle` (optional, depends on context)
- Border radius: `--radius-md`
- Padding: `--space-5`
- Elevation: `--elev-1`

### Stat Block (the hero component)

The core visual unit of the app. Shows a single metric with its label and optional trend.

- Large display number (`--text-display-l` or `--text-display-xl`) in `--fg-primary`
- Uppercase label (`--text-caption`) in `--fg-tertiary`, above the number
- Optional trend indicator: `--success` or `--danger` color, small arrow or delta value
- Optional unit (e.g., "g", "kg", "%") in `--fg-secondary` at 60% of number size
- Used everywhere: today's macros, InBody values, progress deltas

### Progress Ring / Bar

- Track: `--border-subtle`
- Fill: `--accent` when in range, `--success` when target hit, `--warning` when drifting low, `--danger` when significant deficit
- Animation: fills smoothly over `--motion-medium` when value changes
- Used for: daily macro progress, weekly plan adherence

### Chat Bubble (coach and user)

**User bubble**
- Background: `--bg-subtle`
- Text: `--fg-primary`
- Aligned right
- Border radius: `--radius-md` with bottom-right corner reduced to `--radius-sm`

**Coach bubble**
- Background: transparent
- Text: `--fg-primary` at `--text-body-l`
- Aligned left, no bubble shape, just text with a small accent indicator on the left edge
- Feels like reading a message, not chatting with a bot

### Nav

**Mobile (bottom tab bar)**
- Fixed bottom, `--bg-surface` background
- Three tabs: Today, Plan, Coach
- Active tab: `--accent` icon and label
- Inactive: `--fg-tertiary`

**Desktop (side rail, 72px collapsed, 240px expanded)**
- Icons only collapsed, icon + label expanded
- Tabs: Today, Plan, Coach, Progress, Settings
- Active: accent bar on left edge, `--fg-primary` text

### Empty State

Every list, chart, and data surface has a designed empty state. No blank screens.

- Short headline (`--text-display-m`, `--fg-primary`)
- One sentence of body (`--text-body-m`, `--fg-secondary`)
- One primary action

### Confirmation Prompt (used heavily by Daily Logger)

When the AI asks "roughly 35g protein, 45g carbs, confirm?":
- Stat blocks for the three estimated macros, horizontally laid out
- Primary button "Confirm and log"
- Tertiary button "Edit values"
- Tertiary button "Re-describe"

## Patterns

### Data reveal pattern

When a value is calculated by the AI or calibration engine (macro targets, estimated meal, coach response), the number animates in from 0 over `--motion-medium`. This reinforces that something was computed, not retrieved. Used sparingly, only for hero numbers.

### Inline coach suggestion

When the coach wants to proactively flag something (under-eating, timing issue), the message appears as a dismissible strip inside the Today view, not as a modal or notification. Accent dim background, coach bubble style, one action button.

### Side-by-side comparison (InBody scans)

Two or three scans shown in vertical columns, stat blocks aligned by metric. Deltas shown between columns, colored by direction (muscle up is success, body fat down is success, but the logic is goal-aware not just direction-aware).

### Training day vs rest day visual distinction

Training days have a subtle accent-colored top border on the day container. Rest days do not. This carries through the weekly plan view and the daily logger header.

## Iconography

Icons are used sparingly. Line icons, 1.5px stroke, `--fg-secondary` default, `--fg-primary` active. Source: Lucide or custom. No filled icons, no brand-style icons.

## Charts

- Line charts for weight and body fat over time: 1px line in `--accent`, subtle fill underneath at 10% opacity
- Bar charts for daily macro adherence: bars in `--fg-secondary`, target line in `--accent`
- No pie charts, ever
- Axes in `--fg-tertiary`, `--text-caption`
- Grid lines at `--border-subtle`, minimal

## Accessibility

- All text meets WCAG AA contrast on dark backgrounds (`--fg-primary` on `--bg-canvas` is 16:1, `--fg-secondary` is 8.2:1)
- Accent color meets contrast for large text and UI components (3:1 on `--bg-canvas`)
- All interactive elements have a visible focus state using `--accent` outline
- All motion respects `prefers-reduced-motion`
- Minimum tap target size 44x44 on mobile

## What This System Does Not Include (v1)

- Light mode
- Alternate themes or white labeling
- Illustrations, mascots, or decorative graphics
- A full icon set (only what is needed for nav and actions)
- Email design tokens (handled separately)
- Marketing site components (handled separately, can reuse tokens)

## Handoff Notes for Claude Design

When ingested into Claude Design, use this system as the single source of truth for:

1. Color selection (do not invent new hex values)
2. Typography (do not substitute fonts)
3. Spacing (do not use arbitrary px values)
4. Component patterns (do not create new components without checking this file first)

If a design decision is not covered by this system, flag it explicitly so it can be added rather than improvised silently.
