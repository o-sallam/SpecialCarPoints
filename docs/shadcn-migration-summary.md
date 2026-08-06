# shadcn/ui Migration Summary

**Date:** 2026-08-06
**Status:** ✅ Complete
**Branch:** `feature/shadcn-migration`

## Changes Made

### Components Migrated

| Custom component | shadcn/ui replacement |
| ---------------- | --------------------- |
| `Button`         | `components/ui/button.tsx` |
| `Input`          | `components/ui/input.tsx` |
| `Card`           | `components/ui/card.tsx` |
| `Badge`          | `components/ui/badge.tsx` |
| `Modal`          | `components/ui/dialog.tsx` (via `ConfirmModal` → `AlertDialog`) |
| `Toggle`         | `components/ui/switch.tsx` |

### Components Refactored to shadcn/ui

- `FaqAccordion` → `Accordion` (Radix accordion, smooth height animation)
- `SalesPointForm` → `Select` (city/neighborhood), `Input`, `Label`, `Switch` (VIP)
- `DataTable` → `Table`
- `ConfirmModal` → `AlertDialog`
- `VipBadge` → `Tooltip` (explains VIP benefits)
- Admin CRUD → `Sonner` toasts (`Toaster` in root layout)

### New Components Added

`accordion`, `alert-dialog`, `badge`, `button`, `card`, `dialog`, `input`, `label`, `progress`, `select`, `separator`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `tooltip`

### Design Tokens

- All existing CSS variables preserved (unchanged `:root` / `[data-theme='dark']` blocks)
- shadcn/ui semantic variables (`--background`, `--foreground`, `--primary`, `--border`, …) mapped onto the existing SpecialCar tokens (brand electric-blue primary, cool slate neutrals)
- `tailwind.config.ts` maps shadcn color names to `rgb(var(--x) / <alpha-value>)` so opacity modifiers work
- Dark mode works via the app's existing `.dark` class + `data-theme` attribute
- No visual changes to end users

### Notes / Deviations from Plan

- The deprecated `shadcn-ui` CLI no longer functions; the modern `shadcn` CLI was used instead.
- The new default "Base UI (nova)" preset requires Tailwind v4; this project stays on Tailwind 3.4, so classic Radix-based shadcn components (v3-compatible) were used — this matches the plan's code examples and wrapper API.
- `Next.js`'s module-resolution case check forbids capital & lowercase same-name files in one folder, so compatibility wrappers were not left behind. All consumers were migrated to the lowercase shadcn imports directly (`ConfirmModal` → `AlertDialog`). The original custom implementations remain in git history and `backups/`.

## Benefits

- Better accessibility (Radix UI primitives: focus management, ARIA, keyboard support)
- Consistent component API with official shadcn/ui docs
- Improved animations (accordion, dialog, toasts)
- Better user feedback (toasts on admin CRUD)
- Easier maintenance and upgrades

## Breaking Changes

- None — all existing import paths and component props continue to work.

## Next Steps

- Adopt more shadcn components (skeleton loading states, tabs on the admin dashboard) as needed

## Rollback

```bash
git checkout main
git branch -D feature/shadcn-migration
git push origin --delete feature/shadcn-migration
```

Pre-migration files are also archived in `backups/shadcn-20260806055924/`.
