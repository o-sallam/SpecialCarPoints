# Special Car — Design Tokens

The source of truth lives in **`app/globals.css`** as CSS custom properties so
every value is themeable at runtime (light/dark) and reachable from Tailwind via
`var(--…)` (e.g. `bg-[var(--color-surface)]`). This file documents the system.

The palette intentionally moves away from a single flat brand blue toward a
**deliberate identity**: an electric-blue primary scale + a warm amber accent
(for geolocation / "nearest to you" / VIP) on a cool slate neutral base.

---

## 1. Color

### Primary — electric blue
| Token | Value | Use |
|---|---|---|
| `--primary-50` … `--primary-900` | `#eff6ff` → `#1e3a8a` | full ramp for tints/shades |
| `--color-primary` | `#2563eb` (light) / `#60a5fa` (dark) | buttons, links, focus, selected |
| `--color-primary-hover` | `#1d4ed8` / `#93c5fd` | hover state |
| `--color-primary-soft` | `#eff6ff` / rgba(59,130,246,.14) | subtle fills (chips, soft badges) |

### Accent — amber (geolocation / nearest / VIP)
| Token | Value |
|---|---|
| `--accent-50 … --accent-700` | `#fffbeb` → `#b45309` |
| `--color-accent` / `--color-accent-hover` | `#f59e0b` → `#d97706` |
| `--color-accent-soft` | `#fffbeb` / rgba(245,158,11,.12) |

> Accent is **never** the page background. It marks location-aware affordances
> (geolocation button, distance badge, recentered marker) so the user always
> knows "this is about *my* location".

### Neutrals — cool slate
`--neutral-0 … --neutral-950` (`#ffffff` → `#020617`). Semantics derived from them:

| Semantic | Light | Dark |
|---|---|---|
| `--color-surface` | `#ffffff` | `#161c2a` |
| `--color-background` | `#f4f6fa` | `#0b0f18` |
| `--color-text` | `#0f172a` | `#e6edf6` |
| `--color-text-secondary` | `#64748b` | `#93a0b3` |
| `--color-text-muted` | `#94a3b8` | `#64748b` |
| `--color-border` / `--color-border-strong` | `#e2e8f0` / `#cbd5e1` | `#262e3e` / `#334155` |
| `--color-error` / `--color-success` | `#dc2626` / `#16a34a` | `#f87171` / `#4ade80` |

Region colors (map/list accents) are defined per-region in `lib/geo.ts` (`REGIONS`).

---

## 2. Typography

**Pairing:** headings **Tajawal** (800), body **Cairo** — both loaded via
`next/font` in `app/layout.tsx` and exposed as `--font-tajawal` / `--font-cairo`.

| Token | Value |
|---|---|
| `--font-heading` | `var(--font-tajawal), var(--font-cairo), ui-sans-serif, system-ui, sans-serif` |
| `--font-body` | `var(--font-cairo), ui-sans-serif, system-ui, sans-serif` |
| `--tracking-tight` | `-0.02em` (applied to all headings via the base layer) |

### Type scale
`--text-xs .75rem` · `--text-sm .875rem` · `--text-base 1rem` · `--text-lg 1.125rem`
· `--text-xl 1.25rem` · `--text-2xl 1.5rem` · `--text-3xl 1.875rem` · `--text-4xl 2.25rem` · `--text-5xl 3rem`

Use the `.tnum` utility for counts, prices and distances (tabular numerals).

---

## 3. Spacing scale (rem)
`--space-1` .25 · `--space-2` .5 · `--space-3` .75 · `--space-4` 1 · `--space-5` 1.25
· `--space-6` 1.5 · `--space-8` 2 · `--space-10` 2.5 · `--space-12` 3 · `--space-16` 4
· `--space-20` 5 · `--space-24` 6

---

## 4. Shape — radius (intentionally sharper, "automotive")
`--radius-xs 4px` · `--radius-sm 6px` · `--radius-md 10px` · `--radius-lg 14px`
· `--radius-xl 20px` · `--radius-2xl 28px` · `--radius-pill 999px`

> The locator deliberately avoids ultra-round (20px) cards in favor of 14px to
> read as more technical/precise than a soft-SaaS reference. (`--radius-full`
> remains as a legacy alias.)

---

## 5. Elevation
`--shadow-xs` · `--shadow-sm` · `--shadow-md` · `--shadow-lg` (cool, slate-tinted)
· `--shadow-accent` (amber glow used on the active geolocation button).

---

## 6. Motion
`--duration-fast 120ms` · `--duration 200ms` · `--duration-slow 320ms`
· `--ease cubic-bezier(.4,0,.2,1)` · `--ease-out cubic-bezier(.16,1,.3,1)`

Animations: `.animate-pop-in` (empty state), `.sc-locate-pulse` (user marker ring).

---

## 7. z-index
`--z-map 0` (Leaflet is `isolate`-d inside `.map-isolate`) · `--z-sticky 30`
· `--z-header 40` · `--z-dropdown 50` · `--z-overlay 1000` · `--z-toast 1100`

---

## Usage in components
Prefer token references over hard-coded values everywhere:

```tsx
// good
<div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text)] shadow-[var(--shadow-sm)]" />

// avoid
<div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-900 shadow-sm" />
```
