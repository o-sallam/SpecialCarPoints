# shadcn/ui Migration Checklist

**Project:** SpecialCarPoints  
**Branch:** `feature/shadcn-migration`  
**Started:** _______________  
**Completed:** _______________  

---

## ☐ Phase 1: Setup & Installation

- [ ] 1.1 Create feature branch `feature/shadcn-migration`
- [ ] 1.2 Run `npx shadcn-ui@latest init`
  - [ ] TypeScript: Yes
  - [ ] CSS variables: Yes
  - [ ] Component dir: `@/components`
  - [ ] Utils dir: `@/lib`
- [ ] 1.3 Backup all critical files (8 files)
- [ ] 1.4 Configure `components.json`
- [ ] 1.5 Merge CSS variables in `globals.css`
  - [ ] Preserve all existing tokens
  - [ ] Add shadcn variables
  - [ ] Reference existing tokens
- [ ] 1.6 Test `cn()` utility works
- [ ] ✅ Build succeeds
- [ ] ✅ Dev server starts
- [ ] 📝 Commit: "Phase 1: Setup shadcn/ui"

**Notes:**
```





```

---

## ☐ Phase 2: Core Component Migration

### Button
- [ ] 2.1 Install: `npx shadcn-ui@latest add button`
- [ ] 2.2 Rename `Button.tsx` to `Button.deprecated.tsx`
- [ ] 2.3 Create compatibility wrapper `Button.tsx`
- [ ] ✅ Build succeeds
- [ ] ✅ Test home page
- [ ] ✅ Test admin page

### Input
- [ ] 2.3 Install: `npx shadcn-ui@latest add input`
- [ ] 2.4 Create wrapper
- [ ] ✅ Test search input
- [ ] ✅ Test form inputs

### Card
- [ ] 2.5 Install: `npx shadcn-ui@latest add card`
- [ ] 2.6 Create wrapper
- [ ] ✅ Test EntryCard
- [ ] ✅ Test StatCard
- [ ] ✅ Test EmptyState

### Badge
- [ ] 2.7 Install: `npx shadcn-ui@latest add badge`
- [ ] 2.8 Create wrapper
- [ ] ✅ Test VipBadge
- [ ] ✅ Test CategoryFilters

### Dialog (Modal)
- [ ] 2.9 Install: `npx shadcn-ui@latest add dialog`
- [ ] 2.10 Create Modal wrapper
- [ ] ✅ Test ConfirmModal

### Switch (Toggle)
- [ ] 2.11 Install: `npx shadcn-ui@latest add switch`
- [ ] 2.12 Create Toggle wrapper
- [ ] ✅ Test ThemeSwitcher
- [ ] ✅ Test VIP toggle in form

### Phase 2 Verification
- [ ] ✅ All pages load
- [ ] ✅ All buttons work
- [ ] ✅ All inputs work
- [ ] ✅ All cards display
- [ ] ✅ All badges show
- [ ] ✅ Modals open/close
- [ ] ✅ Toggles work
- [ ] 📝 Commit: "Phase 2: Core components"

**Notes:**
```





```

---

## ☐ Phase 3: Complex Component Migration

### Accordion
- [ ] 3.1 Install: `npx shadcn-ui@latest add accordion`
- [ ] 3.2 Refactor FaqAccordion
- [ ] ✅ Test FAQ on home page

### Select
- [ ] 3.3 Install: `npx shadcn-ui@latest add select`
- [ ] 3.4 Refactor SalesPointForm dropdowns
- [ ] ✅ Test city dropdown
- [ ] ✅ Test neighborhood dropdown

### Label
- [ ] 3.5 Install: `npx shadcn-ui@latest add label`
- [ ] 3.6 Add labels to all form inputs
- [ ] ✅ Accessibility improved

### Table
- [ ] 3.7 Install: `npx shadcn-ui@latest add table`
- [ ] 3.8 Refactor DataTable
- [ ] ✅ Test admin table
- [ ] ✅ Test sorting
- [ ] ✅ Test actions

### Separator
- [ ] 3.9 Install: `npx shadcn-ui@latest add separator`

### Tooltip
- [ ] 3.10 Install: `npx shadcn-ui@latest add tooltip`
- [ ] 3.11 Add tooltips to icons/badges
- [ ] ✅ Test hover tooltips
- [ ] ✅ Test keyboard access

### Skeleton
- [ ] 3.12 Install: `npx shadcn-ui@latest add skeleton`
- [ ] 3.13 Add loading states
- [ ] ✅ Test loading skeletons

### Phase 3 Verification
- [ ] ✅ Accordion works
- [ ] ✅ Dropdowns work
- [ ] ✅ Forms accessible
- [ ] ✅ Table functional
- [ ] ✅ Tooltips appear
- [ ] ✅ Loading states show
- [ ] 📝 Commit: "Phase 3: Complex components"

**Notes:**
```





```

---

## ☐ Phase 4: Admin Dashboard Migration

### Alert Dialog
- [ ] 4.1 Install: `npx shadcn-ui@latest add alert-dialog`
- [ ] 4.2 Refactor ConfirmModal
- [ ] ✅ Test delete confirmation

### Tabs (Optional)
- [ ] 4.3 Install: `npx shadcn-ui@latest add tabs`
- [ ] 4.4 Enhance dashboard with tabs (if needed)

### Progress
- [ ] 4.5 Install: `npx shadcn-ui@latest add progress`

### Sonner (Toasts)
- [ ] 4.6 Install: `npx shadcn-ui@latest add sonner`
- [ ] 4.7 Add Toaster to layout
- [ ] 4.8 Replace alerts with toasts
- [ ] ✅ Test success toasts
- [ ] ✅ Test error toasts
- [ ] ✅ Test loading toasts

### Phase 4 Verification
- [ ] ✅ All admin functions work
- [ ] ✅ CRUD operations work
- [ ] ✅ Confirmations work
- [ ] ✅ Toasts appear correctly
- [ ] ✅ Forms validate
- [ ] 📝 Commit: "Phase 4: Admin dashboard"

**Notes:**
```





```

---

## ☐ Phase 5: Testing & Validation

### Manual Testing
- [ ] 5.1 Home page (`/`)
  - [ ] Hero loads
  - [ ] FAQ accordion
  - [ ] CTA buttons
  - [ ] Footer
  - [ ] Theme switcher
- [ ] 5.2 Sales Points (`/sales-points`)
  - [ ] Map loads
  - [ ] List displays
  - [ ] Search works
  - [ ] Filters work
  - [ ] Geolocation
  - [ ] Cards display
  - [ ] VIP badges
  - [ ] Social links
- [ ] 5.3 Admin Dashboard (`/admin`)
  - [ ] Login
  - [ ] Stats display
  - [ ] Table loads
  - [ ] Create form
  - [ ] Edit form
  - [ ] Delete with confirm
  - [ ] Logout

### Responsive Testing
- [ ] 5.4 Mobile (375px)
- [ ] 5.5 Tablet (768px)
- [ ] 5.6 Desktop (1024px+)

### Accessibility
- [ ] 5.7 Lighthouse audit (score > 95)
- [ ] 5.8 axe DevTools (zero violations)
- [ ] 5.9 Keyboard navigation
- [ ] 5.10 Screen reader test
- [ ] 5.11 Focus indicators
- [ ] 5.12 Color contrast

### Cross-Browser
- [ ] 5.13 Chrome/Edge
- [ ] 5.14 Firefox
- [ ] 5.15 Safari
- [ ] 5.16 Mobile Safari
- [ ] 5.17 Chrome Mobile

### Performance
- [ ] 5.18 Lighthouse Performance > 90
- [ ] 5.19 Bundle size check
- [ ] 5.20 No console errors
- [ ] 5.21 No console warnings

### Documentation
- [ ] 5.22 Update README
- [ ] 5.23 Update DESIGN_TOKENS.md
- [ ] 5.24 Create migration summary

**Notes:**
```





```

---

## ☐ Phase 6: Cleanup

- [ ] 6.1 Remove `.deprecated.tsx` files (6 files)
- [ ] 6.2 Remove `.backup` files (8 files)
- [ ] 6.3 Optional: Convert imports to lowercase
- [ ] 6.4 Optional: Remove compatibility wrappers
- [ ] 6.5 Clean up unused dependencies
- [ ] 6.6 Final build test
- [ ] 6.7 Final regression test
- [ ] 6.8 Create Pull Request
- [ ] 6.9 Get PR approval
- [ ] 6.10 Merge to main
- [ ] 6.11 Verify production

**PR Checklist:**
- [ ] Title: "Migrate UI components to shadcn/ui"
- [ ] Description complete
- [ ] Screenshots attached
- [ ] All tests passing
- [ ] Backward compatible
- [ ] Documentation updated

**Notes:**
```





```

---

## Final Verification

### Success Criteria
- [ ] ✅ All pages load without errors
- [ ] ✅ All UI components render correctly
- [ ] ✅ All user interactions work
- [ ] ✅ All forms submit and validate
- [ ] ✅ All CRUD operations work
- [ ] ✅ Search and filters work
- [ ] ✅ Map integration works
- [ ] ✅ Geolocation works
- [ ] ✅ Theme switcher works
- [ ] ✅ All links work
- [ ] ✅ Build succeeds (zero errors)
- [ ] ✅ No console errors
- [ ] ✅ No TypeScript errors
- [ ] ✅ Bundle size acceptable
- [ ] ✅ Performance maintained
- [ ] ✅ Lighthouse accessibility > 95
- [ ] ✅ Zero accessibility violations
- [ ] ✅ Keyboard accessible
- [ ] ✅ Screen reader friendly
- [ ] ✅ Visual appearance matches
- [ ] ✅ Responsive on all sizes
- [ ] ✅ Cross-browser compatible
- [ ] ✅ Documentation updated
- [ ] ✅ Migration summary created
- [ ] ✅ Code formatted and linted

---

## Rollback Plan (If Needed)

**Trigger rollback if:**
- Production site broken
- Critical functionality lost
- Data corruption
- Security vulnerability

**Rollback steps:**
```bash
# Before merge
git checkout main
git branch -D feature/shadcn-migration

# After merge
git revert -m 1 [MERGE_COMMIT_SHA]
git push origin main
```

**Rollback verified:**
- [ ] Site works
- [ ] No errors
- [ ] All functionality restored

---

## Sign-Off

**Migration completed by:** _______________  
**Date completed:** _______________  
**Reviewed by:** _______________  
**Approved for production:** _______________  

**Final notes:**
```





```

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Phase 1 | 30-60 min | | |
| Phase 2 | 2-3 hrs | | |
| Phase 3 | 3-4 hrs | | |
| Phase 4 | 2-3 hrs | | |
| Phase 5 | 2-3 hrs | | |
| Phase 6 | 1-2 hrs | | |
| **Total** | **10-16 hrs** | | |

---

**End of Checklist**
