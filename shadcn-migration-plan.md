# shadcn/ui Migration Plan

**Project:** SpecialCarPoints  
**Date:** 2026-08-06  
**Target:** Migrate from custom UI components to shadcn/ui  
**Executor:** Cheaper LLM Agent  

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Analysis](#pre-migration-analysis)
3. [Phase 1: Setup & Installation](#phase-1-setup--installation)
4. [Phase 2: Core Component Migration](#phase-2-core-component-migration)
5. [Phase 3: Complex Component Migration](#phase-3-complex-component-migration)
6. [Phase 4: Admin Dashboard Migration](#phase-4-admin-dashboard-migration)
7. [Phase 5: Testing & Validation](#phase-5-testing--validation)
8. [Phase 6: Cleanup](#phase-6-cleanup)
9. [Rollback Strategy](#rollback-strategy)

---

## Overview

### Current State
- **Framework:** Next.js 14.2.0 with TypeScript
- **Styling:** Tailwind CSS 3.4.0 with custom CSS variables
- **UI Pattern:** Custom components in `/components/ui/`
- **Design System:** Custom design tokens (see `DESIGN_TOKENS.md` and `globals.css`)
- **Components:** 35 React components (6 custom UI primitives)

### Target State
- Replace custom UI primitives with shadcn/ui components
- Maintain existing design tokens and theming
- Preserve all functionality and behavior
- Keep custom business logic components intact

### Migration Strategy
- **Incremental approach:** Migrate one component at a time
- **Backwards compatible:** Keep old components during migration
- **Test-driven:** Verify each component after migration
- **Branch strategy:** Work in feature branch `feature/shadcn-migration`

---

## Pre-Migration Analysis

### Current Custom UI Components

Located in `/components/ui/`:

1. **Button.tsx** (30 lines)
   - Variants: primary, secondary, ghost
   - Uses custom CSS variables
   - ForwardRef implementation
   - **shadcn equivalent:** `button`

2. **Input.tsx** (17 lines)
   - Basic text input with styling
   - ForwardRef implementation
   - **shadcn equivalent:** `input`

3. **Card.tsx** (12 lines)
   - Simple container with border/shadow
   - **shadcn equivalent:** `card`

4. **Badge.tsx**
   - Status/label component
   - **shadcn equivalent:** `badge`

5. **Modal.tsx**
   - Dialog/popup component
   - **shadcn equivalent:** `dialog`

6. **Toggle.tsx**
   - Switch/toggle component
   - **shadcn equivalent:** `switch`

### Components Using Custom UI

**Public Components (15):**
- AccordionLocator.tsx (accordion-like functionality, uses Card)
- CategoryFilters.tsx (uses Button, Badge)
- EmptyState.tsx (uses Card)
- EntryCard.tsx (uses Card, Badge)
- FaqAccordion.tsx (accordion component)
- Footer.tsx (uses Button)
- GeolocationButton.tsx (uses Button)
- Header.tsx (uses Button)
- MapView.tsx (uses Button, Card)
- PricingTiers.tsx (uses Card, Badge)
- RegionGroup.tsx (uses Card, Badge)
- SocialIcons.tsx (uses Button)
- ThemeSwitcher.tsx (uses Toggle)
- TrustCallout.tsx (uses Card)
- VipBadge.tsx (uses Badge)

**Admin Components (8):**
- CityDistribution.tsx (uses Card)
- ConfirmModal.tsx (uses Modal, Button)
- DataTable.tsx (uses Card, Button, Input)
- QuickActions.tsx (uses Button, Card)
- RecentActivity.tsx (uses Card)
- SalesPointForm.tsx (uses Input, Button, Toggle)
- Sidebar.tsx (uses Button)
- StatCard.tsx (uses Card)

### Design Token Compatibility

Current design system uses:
- Custom CSS variables (`--color-primary`, `--color-surface`, etc.)
- Design token scales (primary-50 to primary-900)
- Custom border radius variables
- Custom spacing scale

**Action:** Configure shadcn to use existing CSS variables instead of default theme.

---

## Phase 1: Setup & Installation

### Step 1.1: Create Feature Branch

```bash
git checkout -b feature/shadcn-migration
git push -u origin feature/shadcn-migration
```

**Verification:** Branch created and pushed successfully.

### Step 1.2: Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Configuration prompts:**

1. **TypeScript:** Yes ✓
2. **Style:** Default
3. **Base color:** Slate (matches current neutral scale)
4. **CSS variables:** Yes ✓ (IMPORTANT)
5. **Tailwind config:** Yes ✓
6. **components directory:** `@/components`
7. **utils directory:** `@/lib`
8. **React Server Components:** Yes ✓
9. **tailwind.config.ts format:** Yes ✓

**Expected changes:**
- Creates `components.json`
- Updates `tailwind.config.ts`
- Creates `lib/utils.ts` with `cn` helper
- May modify `globals.css`

**Verification:**
- [ ] `components.json` exists
- [ ] `lib/utils.ts` exists and exports `cn` function
- [ ] Build succeeds: `npm run build`

### Step 1.3: Backup Critical Files

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

**Verification:** All backup files created.

### Step 1.4: Configure shadcn Theme

Edit `components.json` to preserve existing design tokens:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Verification:** File saved correctly.

### Step 1.5: Merge CSS Variables

After shadcn init, `globals.css` will have new CSS variables. We need to merge them with existing ones.

**Action:** Manually merge the shadcn CSS variables with existing design tokens. Keep all existing variables (--primary-50 through --primary-900, --accent-*, --neutral-*, etc.) and add shadcn's variables that reference them.

Example merge pattern:
```css
@layer base {
  :root {
    /* Existing variables - KEEP THESE */
    --primary-50: #eff6ff;
    /* ... all existing tokens ... */
    
    /* shadcn variables - ADD/ADJUST THESE to reference existing tokens */
    --background: var(--neutral-0);
    --foreground: var(--neutral-900);
    --primary: var(--color-primary);
    --primary-foreground: var(--neutral-0);
    /* ... etc ... */
  }
}
```

**Verification:** 
- [ ] All existing CSS variables preserved
- [ ] shadcn variables added and reference existing tokens
- [ ] Dark mode variables configured (if applicable)
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`

### Step 1.6: Test cn Utility

Create test file: `lib/utils.test.ts` (optional)

```typescript
import { cn } from './utils'

// Test merging classes
console.log(cn('px-4', 'px-2')) // Should output: 'px-2'
console.log(cn('px-4 py-2', 'py-3')) // Should output: 'px-4 py-3'
```

**Verification:** `cn` utility works as expected.

---

## Phase 2: Core Component Migration

### Step 2.1: Install Button Component

```bash
npx shadcn-ui@latest add button
```

**Expected:** Creates `components/ui/button.tsx` with shadcn implementation.

**Verification:**
- [ ] File `components/ui/button.tsx` created
- [ ] No build errors

### Step 2.2: Migrate Custom Button to shadcn

**Current file:** `components/ui/Button.tsx` (capital B)  
**New file:** `components/ui/button.tsx` (lowercase b, created by shadcn)

**Action:**

1. Review the shadcn `button.tsx` variants: default, destructive, outline, secondary, ghost, link
2. Map current variants to shadcn variants:
   - `primary` → `default`
   - `secondary` → `secondary`
   - `ghost` → `ghost`

3. Rename old file to indicate deprecation:
   ```bash
   mv components/ui/Button.tsx components/ui/Button.deprecated.tsx
   ```

4. Create new `components/ui/Button.tsx` as a compatibility wrapper:

```typescript
// components/ui/Button.tsx
// Compatibility wrapper - forwards to shadcn button
import { Button as ShadcnButton } from './button'
import { ButtonProps as ShadcnButtonProps } from './button'
import { forwardRef } from 'react'

interface ButtonProps extends Omit<ShadcnButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => {
    const shadcnVariant = 
      variant === 'primary' ? 'default' :
      variant === 'secondary' ? 'secondary' :
      'ghost'
    
    return <ShadcnButton ref={ref} variant={shadcnVariant} {...props} />
  }
)

Button.displayName = 'Button'

export default Button
```

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] All components using Button still work
- [ ] Visual regression: buttons look the same in dev mode

**Test pages:**
- `/` (home page - uses Button in Header, Footer)
- `/sales-points` (uses Button in filters)
- `/admin` (uses Button extensively)

### Step 2.3: Install Input Component

```bash
npx shadcn-ui@latest add input
```

**Expected:** Creates `components/ui/input.tsx`

**Verification:**
- [ ] File `components/ui/input.tsx` created
- [ ] No build errors

### Step 2.4: Migrate Custom Input to shadcn

**Current file:** `components/ui/Input.tsx`  
**New file:** `components/ui/input.tsx` (created by shadcn)

**Action:**

1. Rename old file:
   ```bash
   mv components/ui/Input.tsx components/ui/Input.deprecated.tsx
   ```

2. Create compatibility wrapper:

```typescript
// components/ui/Input.tsx
// Compatibility wrapper - forwards to shadcn input
import { Input as ShadcnInput } from './input'
import { InputProps as ShadcnInputProps } from './input'
import { forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, ShadcnInputProps>(
  (props, ref) => {
    return <ShadcnInput ref={ref} {...props} />
  }
)

Input.displayName = 'Input'

export default Input
```

**Verification:**
- [ ] Build succeeds
- [ ] Test SalesPointForm (admin): all inputs work
- [ ] Test search input in AccordionLocator: works
- [ ] Visual check: inputs look correct

### Step 2.5: Install Card Component

```bash
npx shadcn-ui@latest add card
```

**Expected:** Creates `components/ui/card.tsx` with Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter exports.

**Verification:**
- [ ] File `components/ui/card.tsx` created
- [ ] No build errors

### Step 2.6: Migrate Custom Card to shadcn

**Current file:** `components/ui/Card.tsx` (simple wrapper)  
**New file:** `components/ui/card.tsx` (shadcn with sub-components)

**Action:**

1. Analyze current usage - most components use simple `<Card>` wrapper
2. Rename old file:
   ```bash
   mv components/ui/Card.tsx components/ui/Card.deprecated.tsx
   ```

3. Create compatibility wrapper:

```typescript
// components/ui/Card.tsx
// Compatibility wrapper - forwards to shadcn card
import { Card as ShadcnCard } from './card'
import { CardProps as ShadcnCardProps } from './card'

export default function Card(props: ShadcnCardProps) {
  return <ShadcnCard {...props} />
}

// Re-export other card components for direct use
export { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from './card'
```

**Verification:**
- [ ] Build succeeds
- [ ] All Card usages still work
- [ ] Visual check on:
  - EntryCard component (public)
  - StatCard component (admin)
  - EmptyState component
  - PricingTiers component

### Step 2.7: Install Badge Component

```bash
npx shadcn-ui@latest add badge
```

**Expected:** Creates `components/ui/badge.tsx`

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 2.8: Migrate Custom Badge to shadcn

**Action:**

1. Check current Badge implementation (likely has variants)
2. Rename old:
   ```bash
   mv components/ui/Badge.tsx components/ui/Badge.deprecated.tsx
   ```

3. Create wrapper:

```typescript
// components/ui/Badge.tsx
// Compatibility wrapper
import { Badge as ShadcnBadge } from './badge'
import { BadgeProps as ShadcnBadgeProps } from './badge'

export default function Badge(props: ShadcnBadgeProps) {
  return <ShadcnBadge {...props} />
}
```

**Verification:**
- [ ] Build succeeds
- [ ] Check VipBadge component
- [ ] Check CategoryFilters badges
- [ ] Check EntryCard badges

### Step 2.9: Install Dialog Component (replaces Modal)

```bash
npx shadcn-ui@latest add dialog
```

**Expected:** Creates `components/ui/dialog.tsx` with Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 2.10: Migrate Custom Modal to shadcn Dialog

**Current file:** `components/ui/Modal.tsx`  
**New file:** `components/ui/dialog.tsx` (shadcn)

**Action:**

1. Analyze Modal component API and usage
2. Rename old:
   ```bash
   mv components/ui/Modal.tsx components/ui/Modal.deprecated.tsx
   ```

3. Create compatibility wrapper OR refactor ConfirmModal directly:

```typescript
// components/ui/Modal.tsx
// Compatibility wrapper for Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children,
  footer 
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
```

**Verification:**
- [ ] Build succeeds
- [ ] Test ConfirmModal (admin): opens, closes, confirms work
- [ ] Visual check: modal appears correctly

### Step 2.11: Install Switch Component (replaces Toggle)

```bash
npx shadcn-ui@latest add switch
```

**Expected:** Creates `components/ui/switch.tsx`

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 2.12: Migrate Custom Toggle to shadcn Switch

**Current file:** `components/ui/Toggle.tsx`  
**New file:** `components/ui/switch.tsx` (shadcn)

**Action:**

1. Check Toggle API (likely has checked/onChange props)
2. Rename old:
   ```bash
   mv components/ui/Toggle.tsx components/ui/Toggle.deprecated.tsx
   ```

3. Create wrapper:

```typescript
// components/ui/Toggle.tsx
// Compatibility wrapper for Switch
import { Switch } from './switch'
import { SwitchProps } from './switch'

export default function Toggle(props: SwitchProps) {
  return <Switch {...props} />
}
```

**Verification:**
- [ ] Build succeeds
- [ ] Test ThemeSwitcher component
- [ ] Test VIP toggle in SalesPointForm (admin)

### Step 2.13: Phase 2 Complete - Run Full Test

**Verification checklist:**

- [ ] `npm run build` succeeds with no errors
- [ ] `npm run dev` starts successfully
- [ ] All pages load without errors:
  - [ ] `/` (home)
  - [ ] `/sales-points` (main app)
  - [ ] `/admin` (admin dashboard)
- [ ] Visual regression check:
  - [ ] Buttons look correct (all variants)
  - [ ] Inputs look correct and work
  - [ ] Cards have proper styling
  - [ ] Badges display correctly
  - [ ] Modals/dialogs open and close
  - [ ] Theme switcher toggle works
- [ ] Functionality check:
  - [ ] Forms submit correctly
  - [ ] Filters work
  - [ ] Search works
  - [ ] Admin CRUD operations work

**If all checks pass:** Commit Phase 2

```bash
git add .
git commit -m "Phase 2: Migrate core UI components to shadcn/ui"
git push
```

**If checks fail:** Debug and fix issues before proceeding to Phase 3.

---

## Phase 3: Complex Component Migration

This phase involves refactoring components that need more than simple component swaps.

### Step 3.1: Install Accordion Component

```bash
npx shadcn-ui@latest add accordion
```

**Purpose:** For FaqAccordion and AccordionLocator components.

**Verification:**
- [ ] File `components/ui/accordion.tsx` created
- [ ] No build errors

### Step 3.2: Refactor FaqAccordion Component

**File:** `components/public/FaqAccordion.tsx`

**Current implementation:** Custom accordion (likely using details/summary or state management)

**Action:**

1. Read current implementation:
   ```bash
   cat components/public/FaqAccordion.tsx
   ```

2. Identify FAQ data structure

3. Refactor to use shadcn Accordion:

```typescript
// Example refactor (adjust based on actual implementation)
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQ {
  question: string
  answer: string
}

export default function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

**Verification:**
- [ ] Build succeeds
- [ ] FAQ accordion works on home page
- [ ] Animations are smooth
- [ ] Styling matches design

### Step 3.3: Install Select Component

```bash
npx shadcn-ui@latest add select
```

**Purpose:** For dropdown selects in SalesPointForm and filters.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 3.4: Refactor SalesPointForm Dropdowns

**File:** `components/admin/SalesPointForm.tsx`

**Current implementation:** Native `<select>` elements

**Action:**

1. Identify all select elements in the form:
   - City dropdown
   - Neighborhood dropdown

2. Replace with shadcn Select:

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Example for city select
<Select value={form.cityId} onValueChange={(value) => update('cityId', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select city" />
  </SelectTrigger>
  <SelectContent>
    {cities.map((city) => (
      <SelectItem key={city._id} value={city._id}>
        {city.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Verification:**
- [ ] Build succeeds
- [ ] City dropdown works in admin form
- [ ] Neighborhood dropdown works and filters by city
- [ ] Form submission works
- [ ] Styling matches design

### Step 3.5: Install Label Component

```bash
npx shadcn-ui@latest add label
```

**Purpose:** For form labels with proper accessibility.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 3.6: Enhance Forms with Labels

**File:** `components/admin/SalesPointForm.tsx`

**Action:**

Add labels to all form inputs:

```typescript
import { Label } from '@/components/ui/label'

// Example
<div className="space-y-2">
  <Label htmlFor="cityId">City</Label>
  <Select value={form.cityId} onValueChange={(value) => update('cityId', value)}>
    {/* ... */}
  </Select>
</div>
```

**Verification:**
- [ ] All inputs have labels
- [ ] Labels are properly associated (htmlFor matches input id)
- [ ] Screen reader accessibility improved

### Step 3.7: Install Table Component

```bash
npx shadcn-ui@latest add table
```

**Purpose:** For DataTable in admin dashboard.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 3.8: Refactor DataTable Component

**File:** `components/admin/DataTable.tsx`

**Current implementation:** Likely custom table with HTML table elements

**Action:**

1. Read current DataTable implementation
2. Refactor to use shadcn Table:

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Example refactor
export default function DataTable({ data }: { data: any[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column 1</TableHead>
            <TableHead>Column 2</TableHead>
            {/* ... */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{row.field1}</TableCell>
              <TableCell>{row.field2}</TableCell>
              {/* ... */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

**Verification:**
- [ ] Build succeeds
- [ ] Table displays correctly in admin
- [ ] All columns visible
- [ ] Row actions (edit/delete) work
- [ ] Responsive on mobile

### Step 3.9: Install Separator Component

```bash
npx shadcn-ui@latest add separator
```

**Purpose:** For visual dividers in layouts.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 3.10: Install Tooltip Component

```bash
npx shadcn-ui@latest add tooltip
```

**Purpose:** For helpful hints and information.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 3.11: Enhance UI with Tooltips

**Action:**

Add tooltips to:
- Icon buttons (explain what they do)
- VIP badges (explain VIP benefits)
- Social media icons (show platform name)

Example in `components/public/VipBadge.tsx`:

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function VipBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="default" className="bg-amber-500">VIP</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Premium service location with extended hours</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

**Verification:**
- [ ] Tooltips appear on hover
- [ ] Tooltips are keyboard accessible
- [ ] Mobile touch support works

### Step 3.12: Install Skeleton Component

```bash
npx shadcn-ui@latest add skeleton
```

**Purpose:** Loading states for async data.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 3.13: Add Loading States

**Action:**

Add skeleton loaders to:
- AccordionLocator while loading points
- DataTable while loading data
- SalesPointForm while loading cities/neighborhoods

Example:

```typescript
import { Skeleton } from '@/components/ui/skeleton'

{loading ? (
  <div className="space-y-2">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  // Actual content
)}
```

**Verification:**
- [ ] Loading skeletons appear during data fetch
- [ ] Smooth transition from skeleton to content
- [ ] Layout doesn't shift

### Step 3.14: Phase 3 Complete - Run Full Test

**Verification checklist:**

- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts successfully
- [ ] All pages load:
  - [ ] Home page with FAQ accordion
  - [ ] Sales points page with filters
  - [ ] Admin page with table
- [ ] New features work:
  - [ ] Accordion animations
  - [ ] Select dropdowns
  - [ ] Form labels and accessibility
  - [ ] Table sorting/actions
  - [ ] Tooltips on hover
  - [ ] Loading skeletons

**Commit Phase 3:**

```bash
git add .
git commit -m "Phase 3: Migrate complex components and add enhancements"
git push
```

---

