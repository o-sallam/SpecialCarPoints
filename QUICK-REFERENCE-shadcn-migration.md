# Quick Reference: shadcn/ui Migration

**For:** Cheaper LLM Agent  
**Main Plan:** See `shadcn-migration-plan.md` for full details  

---

## Quick Start

```bash
git checkout -b feature/shadcn-migration
npx shadcn-ui@latest init
# Answer prompts (TypeScript: Yes, CSS variables: Yes, etc.)
```

---

## Phase Overview

| Phase | Focus | Components | Time |
|-------|-------|------------|------|
| 1 | Setup | - | 30-60 min |
| 2 | Core UI | Button, Input, Card, Badge, Modal, Toggle | 2-3 hrs |
| 3 | Complex | Accordion, Select, Table, Tooltip, Skeleton | 3-4 hrs |
| 4 | Admin | AlertDialog, Tabs, Sonner, Progress | 2-3 hrs |
| 5 | Testing | All components | 2-3 hrs |
| 6 | Cleanup | Remove deprecated files | 1-2 hrs |

---

## Critical Commands

```bash
# Install component
npx shadcn-ui@latest add [component-name]

# Build and test
npm run build
npm run dev

# Commit after each phase
git add .
git commit -m "Phase X: [description]"
git push
```

---

## Component Installation Order

### Phase 2 (Core)
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dialog    # replaces Modal
npx shadcn-ui@latest add switch    # replaces Toggle
```

### Phase 3 (Complex)
```bash
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add select
npx shadcn-ui@latest add label
npx shadcn-ui@latest add table
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add skeleton
```

### Phase 4 (Admin)
```bash
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add sonner
```

---

## Key Files to Update

### Must Edit
- `app/globals.css` - Merge CSS variables
- `tailwind.config.ts` - May be updated by init
- `components/ui/*.tsx` - Create compatibility wrappers
- `app/layout.tsx` - Add Toaster for notifications

### Must Create
- `lib/utils.ts` - cn() utility (created by init)
- `components.json` - Config (created by init)

### Backup First
```bash
cp components/ui/Button.tsx components/ui/Button.tsx.backup
cp components/ui/Input.tsx components/ui/Input.tsx.backup
cp components/ui/Card.tsx components/ui/Card.tsx.backup
cp components/ui/Badge.tsx components/ui/Badge.tsx.backup
cp components/ui/Modal.tsx components/ui/Modal.tsx.backup
cp components/ui/Toggle.tsx components/ui/Toggle.tsx.backup
cp tailwind.config.ts tailwind.config.ts.backup
cp app/globals.css app/globals.css.backup
```

---

## Compatibility Wrapper Template

```typescript
// components/ui/[Component].tsx (capital C)
import { Component as ShadcnComponent } from './component' // lowercase

export default function Component(props) {
  return <ShadcnComponent {...props} />
}
```

---

## Verification After Each Step

```bash
# Build must succeed
npm run build

# No errors in browser console
npm run dev
# Open http://localhost:3000
# Check browser console (F12)

# Test the affected component
# Navigate to page using the component
# Interact with it
# Verify it works as before
```

---

## Common Issues & Fixes

### Build errors after installing component
```bash
rm -rf .next
npm run build
```

### TypeScript errors
```bash
npm install @types/react@latest @types/react-dom@latest
```

### Styles don't match
- Check `app/globals.css` - ensure custom variables preserved
- Check shadcn variables reference custom tokens

### Component not found
- Check import path (lowercase for shadcn)
- Verify file was created in `components/ui/`
- Check `components.json` aliases

---

## Testing Checklist (Phase 5)

**Quick Test:**
- [ ] `/` loads
- [ ] `/sales-points` loads
- [ ] `/admin` loads
- [ ] No console errors
- [ ] Buttons clickable
- [ ] Forms submit
- [ ] Modals open/close

**Full Test:**
- [ ] All interactions work
- [ ] Mobile responsive
- [ ] Accessibility (keyboard nav)
- [ ] Cross-browser
- [ ] Performance (Lighthouse)

---

## Rollback (Emergency)

```bash
# Not yet merged
git checkout main
git branch -D feature/shadcn-migration

# Already merged
git revert -m 1 [MERGE_COMMIT_SHA]
git push origin main
```

---

## Success Indicators

✅ Build succeeds  
✅ No console errors  
✅ All pages load  
✅ All features work  
✅ Lighthouse score > 90  
✅ Bundle size acceptable  
✅ Visual appearance matches  

---

## When Stuck

1. Check full plan: `shadcn-migration-plan.md`
2. Check shadcn docs: https://ui.shadcn.com/
3. Check error message carefully
4. Review recent git commits
5. Try clearing cache: `rm -rf .next`
6. Check if component installed correctly
7. Verify import paths
8. Test in isolation

---

## Phase Completion Checklist

After each phase:
- [ ] All steps completed
- [ ] Build succeeds
- [ ] Manual testing passed
- [ ] No console errors
- [ ] Git commit created
- [ ] Pushed to remote

---

## Final Steps

1. Complete Phase 6 cleanup
2. Run full test suite
3. Update documentation
4. Create PR
5. Get approval
6. Merge to main
7. Deploy
8. Verify production

---

**Remember:** Go slow, test thoroughly, commit often!
