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

## Phase 4: Admin Dashboard Migration

Focus on admin-specific components and features.

### Step 4.1: Install Alert Dialog

```bash
npx shadcn-ui@latest add alert-dialog
```

**Purpose:** For ConfirmModal in admin actions.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 4.2: Refactor ConfirmModal

**File:** `components/admin/ConfirmModal.tsx`

**Action:**

Replace custom Modal with AlertDialog:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Verification:**
- [ ] Delete confirmation works
- [ ] Styling matches design
- [ ] Keyboard navigation works (ESC to close)

### Step 4.3: Install Tabs Component

```bash
npx shadcn-ui@latest add tabs
```

**Purpose:** For potential admin dashboard sections.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 4.4: Optional: Enhance Admin Dashboard with Tabs

**File:** `app/(admin)/admin/page.tsx`

**Action (if applicable):**

Organize admin sections with tabs:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="sales-points">Sales Points</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* Dashboard overview */}
  </TabsContent>
  <TabsContent value="sales-points">
    <DataTable data={salesPoints} />
  </TabsContent>
  <TabsContent value="analytics">
    {/* Analytics charts */}
  </TabsContent>
</Tabs>
```

**Note:** Only implement if current design calls for it.

**Verification:**
- [ ] Tab switching works
- [ ] Content loads correctly
- [ ] URL can be synced with tabs (optional)

### Step 4.5: Install Progress Component

```bash
npx shadcn-ui@latest add progress
```

**Purpose:** For showing upload/processing progress.

**Verification:**
- [ ] File created
- [ ] No build errors

### Step 4.6: Install Toast/Sonner for Notifications

```bash
npx shadcn-ui@latest add sonner
```

**Purpose:** Better notifications for admin actions (save, delete, errors).

**Verification:**
- [ ] Dependencies installed
- [ ] File created
- [ ] No build errors

### Step 4.7: Add Toast Provider

**File:** `app/layout.tsx`

**Action:**

Add Toaster to root layout:

```typescript
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Verification:**
- [ ] Toaster renders without errors
- [ ] Position is correct (consider RTL)

### Step 4.8: Replace Alert/Confirm with Toast

**Files:** 
- `components/admin/SalesPointForm.tsx`
- `components/admin/DataTable.tsx`

**Action:**

Replace console logs and alert() with toast:

```typescript
import { toast } from 'sonner'

// Success
toast.success('Sales point created successfully')

// Error
toast.error('Failed to create sales point')

// Loading
const toastId = toast.loading('Saving...')
// Later
toast.success('Saved!', { id: toastId })

// Info
toast.info('Please select a city first')
```

**Verification:**
- [ ] Toasts appear for all actions
- [ ] Success/error states clear
- [ ] Auto-dismiss works
- [ ] Accessible (screen reader announces)

### Step 4.9: Phase 4 Complete - Test Admin Dashboard

**Verification checklist:**

- [ ] All admin pages load correctly
- [ ] CRUD operations work:
  - [ ] Create new sales point
  - [ ] Edit existing sales point
  - [ ] Delete sales point with confirmation
- [ ] Form validation shows errors
- [ ] Success/error toasts appear
- [ ] Data table is functional
- [ ] All buttons and inputs work

**Commit Phase 4:**

```bash
git add .
git commit -m "Phase 4: Migrate admin dashboard components to shadcn/ui"
git push
```

---

## Phase 5: Testing & Validation

### Step 5.1: Manual Testing Checklist

**Public Pages:**
- [ ] Home page (`/`)
  - [ ] Hero section displays
  - [ ] FAQ accordion expands/collapses
  - [ ] CTA buttons work
  - [ ] Footer links work
  - [ ] Theme switcher works
- [ ] Sales Points page (`/sales-points`)
  - [ ] Map loads correctly
  - [ ] List view displays entries
  - [ ] Search filters results
  - [ ] Category filters work
  - [ ] Geolocation button works
  - [ ] Cards display properly
  - [ ] VIP badges show
  - [ ] Social links work
  - [ ] Accordion groups expand/collapse
- [ ] Mobile responsive
  - [ ] Test on 375px, 768px, 1024px widths
  - [ ] Touch interactions work
  - [ ] No horizontal scroll

**Admin Dashboard:**
- [ ] Login works
- [ ] Dashboard stats display
- [ ] Data table loads
- [ ] Sorting/filtering works
- [ ] Create form:
  - [ ] All inputs work
  - [ ] Dropdowns populate
  - [ ] VIP toggle works
  - [ ] Submit creates entry
  - [ ] Validation shows errors
  - [ ] Success toast appears
- [ ] Edit form:
  - [ ] Loads existing data
  - [ ] Updates work
  - [ ] Success toast appears
- [ ] Delete:
  - [ ] Confirmation modal shows
  - [ ] Cancel works
  - [ ] Confirm deletes entry
  - [ ] Success toast appears
- [ ] Logout works

### Step 5.2: Accessibility Audit

**Tools:** 
- Browser DevTools Lighthouse
- axe DevTools
- Manual keyboard testing

**Checklist:**
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Proper heading hierarchy
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] ARIA attributes correct
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Screen reader friendly

**Fix any issues found before proceeding.**

### Step 5.3: Cross-Browser Testing

**Browsers to test:**
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Check for:**
- Layout issues
- Component rendering
- Interactions work
- Performance acceptable

### Step 5.4: Performance Check

**Run Lighthouse audit:**

```bash
npm run build
npm start
# Open http://localhost:3000 in Chrome
# Run Lighthouse from DevTools
```

**Target scores:**
- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

**If scores are lower:**
- Check bundle size
- Optimize images
- Check for console errors
- Review lazy loading

### Step 5.5: Build Size Analysis

```bash
npm run build
```

**Check output:**
- Compare bundle sizes before/after migration
- Ensure no significant increase (shadcn is tree-shakeable)
- Check for duplicate dependencies

**Expected:** Similar or slightly smaller bundle (shadcn removes unused code).

### Step 5.6: Visual Regression Testing

**Manual comparison:**

1. Take screenshots of key pages before migration (if available)
2. Compare with current pages
3. Document any intentional changes

**Key pages:**
- Home page
- Sales points list
- Admin dashboard
- Forms

**Ensure:**
- Spacing consistent
- Colors match design tokens
- Typography unchanged (unless intentional)
- Borders/shadows consistent

### Step 5.7: Documentation Update

**Files to update:**

1. **README.md** - Add shadcn/ui to tech stack
2. **DESIGN_TOKENS.md** - Document shadcn integration
3. **package.json** - Version bump (optional)

**Example README update:**

```markdown
## Tech Stack

- **Framework:** Next.js 14.2
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS with custom design tokens
- **Database:** MongoDB
- ...
```

### Step 5.8: Create Migration Summary

**File:** `docs/shadcn-migration-summary.md`

```markdown
# shadcn/ui Migration Summary

**Date:** 2026-08-06
**Status:** ✅ Complete

## Changes Made

### Components Migrated
- Button → shadcn/ui button
- Input → shadcn/ui input
- Card → shadcn/ui card
- Badge → shadcn/ui badge
- Modal → shadcn/ui dialog
- Toggle → shadcn/ui switch

### New Components Added
- Accordion (for FAQ)
- Select (for form dropdowns)
- Table (for admin data table)
- Label (for form accessibility)
- Tooltip (for helpful hints)
- Skeleton (for loading states)
- AlertDialog (for confirmations)
- Sonner/Toast (for notifications)

### Design Tokens
- All existing CSS variables preserved
- shadcn variables mapped to existing tokens
- No visual changes to end users

### Bundle Size
- Before: X.X MB
- After: X.X MB
- Change: -X% (or +X%)

## Benefits
- Better accessibility (Radix UI primitives)
- Consistent component API
- Better keyboard navigation
- Improved animations
- Better mobile support
- Easier maintenance
- Official component documentation

## Breaking Changes
- None (all backward compatible through wrappers)

## Next Steps
- Remove deprecated files (Phase 6)
- Add more shadcn components as needed
- Consider adopting more patterns from shadcn
```

---

## Phase 6: Cleanup

### Step 6.1: Remove Deprecated Files

**Action:**

Remove all `.deprecated.tsx` files:

```bash
rm components/ui/Button.deprecated.tsx
rm components/ui/Input.deprecated.tsx
rm components/ui/Card.deprecated.tsx
rm components/ui/Badge.deprecated.tsx
rm components/ui/Modal.deprecated.tsx
rm components/ui/Toggle.deprecated.tsx
```

**Verification:**
- [ ] Build still succeeds
- [ ] No import errors
- [ ] All pages still work

### Step 6.2: Remove Backup Files

```bash
rm components/ui/*.backup
rm tailwind.config.ts.backup
rm app/globals.css.backup
```

### Step 6.3: Update Import Paths

**Action (optional):**

Convert compatibility wrappers to direct shadcn imports throughout the codebase.

**Example:**

Before:
```typescript
import Button from '@/components/ui/Button'
```

After:
```typescript
import { Button } from '@/components/ui/button'
```

**Note:** Only do this if you want to remove compatibility wrappers. Otherwise, keep them for easier future updates.

**If converting:**
- Use find-and-replace across project
- Test thoroughly after each change
- Commit incrementally

### Step 6.4: Optional: Remove Compatibility Wrappers

**If you converted all imports to direct shadcn:**

```bash
rm components/ui/Button.tsx
rm components/ui/Input.tsx
rm components/ui/Card.tsx
rm components/ui/Badge.tsx
rm components/ui/Modal.tsx
rm components/ui/Toggle.tsx
```

**Warning:** Only do this after converting ALL imports to lowercase shadcn versions.

### Step 6.5: Clean Up Unused Dependencies

Check if any old dependencies can be removed:

```bash
npm outdated
```

**Action:** Update or remove unused packages (be cautious).

### Step 6.6: Final Build and Test

```bash
npm run build
npm start
```

**Full regression test:**
- [ ] All pages load
- [ ] All features work
- [ ] No console errors
- [ ] No console warnings
- [ ] Performance acceptable
- [ ] Bundle size acceptable

### Step 6.7: Final Commit

```bash
git add .
git commit -m "Phase 6: Cleanup - remove deprecated files and complete migration"
git push
```

### Step 6.8: Create Pull Request

```bash
# If using GitHub CLI
gh pr create \
  --title "Migrate UI components to shadcn/ui" \
  --body "Completes migration of all custom UI components to shadcn/ui. See shadcn-migration-plan.md for details." \
  --base main \
  --head feature/shadcn-migration
```

**PR Description template:**

```markdown
## Description
Migrates all custom UI components to shadcn/ui while maintaining full backward compatibility and existing design tokens.

## Changes
- ✅ Replaced 6 custom UI primitives with shadcn/ui components
- ✅ Added 8 new shadcn/ui components for enhanced functionality
- ✅ Maintained all existing design tokens and styling
- ✅ Improved accessibility with Radix UI primitives
- ✅ Added loading states and better user feedback
- ✅ All tests passing

## Testing
- [x] Manual testing on all pages
- [x] Accessibility audit (Lighthouse, axe)
- [x] Cross-browser testing
- [x] Mobile responsive testing
- [x] Build size analysis
- [x] Performance check

## Screenshots
[Add before/after screenshots if any visual changes]

## Checklist
- [x] All phases completed (1-6)
- [x] Documentation updated
- [x] No breaking changes
- [x] Backward compatible
- [x] Ready for review
```

### Step 6.9: Merge to Main

**After PR approval:**

```bash
git checkout main
git pull origin main
git merge feature/shadcn-migration
git push origin main
```

**Verification:**
- [ ] Production build succeeds
- [ ] Production site works
- [ ] No errors in production logs

---

## Rollback Strategy

If critical issues arise during migration, follow this rollback procedure.

### When to Rollback

**Immediate rollback if:**
- Production site is broken
- Critical functionality lost
- Data corruption occurs
- Security vulnerability introduced

**Consider rollback if:**
- Multiple components broken
- Accessibility severely degraded
- Performance significantly worse
- Bundle size increased dramatically (>30%)

### Rollback Procedure

#### Option 1: Revert Git Branch (Recommended)

**If not yet merged to main:**

```bash
# Switch to main branch
git checkout main

# Delete feature branch (local and remote)
git branch -D feature/shadcn-migration
git push origin --delete feature/shadcn-migration

# Verify main branch works
npm install
npm run build
npm start
```

**If already merged to main:**

```bash
# Find the merge commit
git log --oneline

# Revert the merge (replace MERGE_COMMIT_SHA with actual SHA)
git revert -m 1 MERGE_COMMIT_SHA

# Push revert
git push origin main
```

**Verification:**
- [ ] Site works on reverted version
- [ ] No errors
- [ ] All functionality restored

#### Option 2: Restore Backup Files

**If individual components need rollback:**

```bash
# Restore backed up files
cp components/ui/Button.tsx.backup components/ui/Button.tsx
cp components/ui/Input.tsx.backup components/ui/Input.tsx
cp components/ui/Card.tsx.backup components/ui/Card.tsx
cp components/ui/Badge.tsx.backup components/ui/Badge.tsx
cp components/ui/Modal.tsx.backup components/ui/Modal.tsx
cp components/ui/Toggle.tsx.backup components/ui/Toggle.tsx
cp tailwind.config.ts.backup tailwind.config.ts
cp app/globals.css.backup app/globals.css

# Remove shadcn files
rm -rf components/ui/button.tsx
rm -rf components/ui/input.tsx
# ... etc

# Rebuild
npm run build
```

**Verification:**
- [ ] Build succeeds
- [ ] All components work
- [ ] No shadcn imports remain

#### Option 3: Partial Rollback

**If only specific phase needs rollback:**

1. Identify problematic phase commit
2. Cherry-pick commits to revert specific changes
3. Test thoroughly

```bash
# Revert specific commit
git revert COMMIT_SHA

# Or reset to specific commit (dangerous - only on feature branch)
git reset --hard COMMIT_SHA
git push -f origin feature/shadcn-migration
```

### Post-Rollback Actions

1. **Document what went wrong:**
   - What broke?
   - Why did it break?
   - What was unexpected?

2. **Create issue for investigation:**
   - Title: "shadcn migration issue: [description]"
   - Include error logs
   - Include steps to reproduce

3. **Plan revised approach:**
   - Address issues found
   - Consider more gradual migration
   - Add more testing steps

4. **Notify team:**
   - Migration rolled back
   - Reason for rollback
   - Timeline for retry (if applicable)

---

## Reference

### shadcn/ui Component Mapping

| Custom Component | shadcn Component | Import Path |
|------------------|------------------|-------------|
| Button | button | `@/components/ui/button` |
| Input | input | `@/components/ui/input` |
| Card | card | `@/components/ui/card` |
| Badge | badge | `@/components/ui/badge` |
| Modal | dialog | `@/components/ui/dialog` |
| Toggle | switch | `@/components/ui/switch` |
| - | accordion | `@/components/ui/accordion` |
| - | select | `@/components/ui/select` |
| - | label | `@/components/ui/label` |
| - | table | `@/components/ui/table` |
| - | tooltip | `@/components/ui/tooltip` |
| - | skeleton | `@/components/ui/skeleton` |
| - | alert-dialog | `@/components/ui/alert-dialog` |
| - | tabs | `@/components/ui/tabs` |
| - | sonner | `@/components/ui/sonner` |
| - | separator | `@/components/ui/separator` |

### Useful Commands

```bash
# Install shadcn component
npx shadcn-ui@latest add [component-name]

# List available components
npx shadcn-ui@latest add

# Update shadcn components
npx shadcn-ui@latest diff

# Check current version
npx shadcn-ui@latest --version
```

### Design Token Mapping

```css
/* shadcn variable → Custom variable */
--background → var(--neutral-0)
--foreground → var(--neutral-900)
--primary → var(--color-primary)
--primary-foreground → var(--neutral-0)
--secondary → var(--neutral-100)
--secondary-foreground → var(--neutral-900)
--muted → var(--neutral-100)
--muted-foreground → var(--neutral-500)
--accent → var(--color-accent)
--accent-foreground → var(--neutral-0)
--destructive → var(--color-error)
--destructive-foreground → var(--neutral-0)
--border → var(--color-border)
--input → var(--color-border)
--ring → var(--color-primary)
--radius → var(--radius-md)
```

### Component Files Created by shadcn

After full migration, you should have:

```
components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── dialog.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── separator.tsx
├── skeleton.tsx
├── sonner.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
└── tooltip.tsx
```

Plus compatibility wrappers (if kept):
```
components/ui/
├── Button.tsx (wrapper)
├── Input.tsx (wrapper)
├── Card.tsx (wrapper)
├── Badge.tsx (wrapper)
├── Modal.tsx (wrapper)
└── Toggle.tsx (wrapper)
```

### Resources

- **shadcn/ui docs:** https://ui.shadcn.com/
- **Radix UI docs:** https://www.radix-ui.com/
- **Tailwind CSS docs:** https://tailwindcss.com/
- **Next.js docs:** https://nextjs.org/docs
- **Accessibility (WCAG):** https://www.w3.org/WAI/WCAG21/quickref/

### Troubleshooting Common Issues

#### Issue: "Module not found" errors after installing component

**Solution:**
- Check `components.json` paths are correct
- Verify `lib/utils.ts` exists
- Restart dev server: `npm run dev`
- Clear Next.js cache: `rm -rf .next`

#### Issue: Styling doesn't match design

**Solution:**
- Check CSS variables in `globals.css`
- Verify shadcn variables reference custom tokens
- Check Tailwind config includes component paths
- Use `cn()` utility for class merging

#### Issue: TypeScript errors

**Solution:**
- Update `@types/react` and `@types/react-dom`
- Check tsconfig.json includes component paths
- Verify imports use correct case (lowercase for shadcn)
- Run `npm run build` to see detailed errors

#### Issue: Components not tree-shaking

**Solution:**
- Import named exports: `import { Button } from '@/components/ui/button'`
- Don't use default exports for shadcn components
- Check bundler config (Next.js handles this automatically)

#### Issue: Dark mode not working

**Solution:**
- Verify `darkMode: 'class'` in `tailwind.config.ts`
- Check dark mode CSS variables in `globals.css`
- Ensure ThemeSwitcher toggles `dark` class on `<html>`

#### Issue: Animations janky or missing

**Solution:**
- Check `@keyframes` in `globals.css`
- Verify Radix UI is installed: `npm list @radix-ui/react-*`
- Check for CSS conflicts
- Test in different browser

#### Issue: RTL layout broken

**Solution:**
- Verify `dir="rtl"` on `<html>` element
- Check Tailwind RTL support
- Some shadcn components may need custom RTL styles
- Test tooltip/popover positioning

---

## Success Criteria

Migration is considered successful when ALL of the following are met:

### Functional Requirements
- [ ] All pages load without errors
- [ ] All UI components render correctly
- [ ] All user interactions work (click, hover, keyboard)
- [ ] All forms submit and validate
- [ ] All CRUD operations work in admin
- [ ] Search and filters work
- [ ] Map integration works
- [ ] Geolocation works
- [ ] Theme switcher works
- [ ] All links and navigation work

### Technical Requirements
- [ ] Build succeeds with zero errors
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] Bundle size acceptable (< 10% increase)
- [ ] Performance scores maintained (Lighthouse > 90)

### Accessibility Requirements
- [ ] Lighthouse accessibility score > 95
- [ ] axe DevTools reports zero violations
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] ARIA attributes correct
- [ ] Color contrast WCAG AA compliant

### Design Requirements
- [ ] Visual appearance matches original (or intentional improvements)
- [ ] Spacing consistent with design tokens
- [ ] Typography unchanged
- [ ] Colors match design system
- [ ] Responsive on all screen sizes
- [ ] Dark mode works (if implemented)
- [ ] RTL layout correct (if applicable)

### Documentation Requirements
- [ ] README updated
- [ ] DESIGN_TOKENS.md updated (if needed)
- [ ] Migration summary document created
- [ ] Code comments added where necessary
- [ ] PR description complete

### Testing Requirements
- [ ] Manual testing completed on all pages
- [ ] Cross-browser testing passed
- [ ] Mobile testing passed
- [ ] Accessibility audit passed
- [ ] Performance audit passed
- [ ] Visual regression checked

### Cleanup Requirements
- [ ] Deprecated files removed
- [ ] Backup files removed
- [ ] Unused imports removed
- [ ] Console.log statements removed
- [ ] TODO comments addressed
- [ ] Code formatted and linted

---

## Post-Migration Maintenance

### Regular Tasks

**Monthly:**
- Check for shadcn/ui updates
- Review component usage for optimization
- Monitor bundle size

**Quarterly:**
- Audit accessibility
- Performance review
- Design system alignment check

**As Needed:**
- Add new shadcn components as features require
- Update custom components to use more shadcn patterns
- Refactor compatibility wrappers (optional)

### Adding New Components

When adding new UI components in the future:

1. Check if shadcn has the component
2. If yes: `npx shadcn-ui@latest add [component]`
3. If no: Create custom component following shadcn patterns
4. Use design tokens for consistency
5. Test accessibility
6. Document in component README

### Updating Components

```bash
# Check for updates
npx shadcn-ui@latest diff

# This will show what's changed in shadcn components
# Review changes carefully before updating
```

---

## Conclusion

This migration plan provides a comprehensive, step-by-step approach to migrating the SpecialCarPoints UI to shadcn/ui. By following this plan systematically, the cheaper LLM agent should be able to:

1. **Safely migrate** all custom UI components to shadcn/ui
2. **Maintain functionality** throughout the migration
3. **Preserve design** tokens and visual consistency
4. **Improve accessibility** with Radix UI primitives
5. **Enhance maintainability** with standardized components

### Key Principles

- **Incremental:** One phase at a time
- **Safe:** Backups and backward compatibility
- **Tested:** Verify each step before proceeding
- **Documented:** Record all changes
- **Reversible:** Clear rollback strategy

### Estimated Timeline

- **Phase 1 (Setup):** 30-60 minutes
- **Phase 2 (Core):** 2-3 hours
- **Phase 3 (Complex):** 3-4 hours
- **Phase 4 (Admin):** 2-3 hours
- **Phase 5 (Testing):** 2-3 hours
- **Phase 6 (Cleanup):** 1-2 hours

**Total:** 10-16 hours (depending on complexity and issues encountered)

### Final Checklist

Before considering the migration complete:

- [ ] All phases (1-6) completed successfully
- [ ] All success criteria met
- [ ] Documentation updated
- [ ] PR created and approved
- [ ] Merged to main branch
- [ ] Production deployment successful
- [ ] Post-deployment verification complete
- [ ] Team notified of completion

---

**Good luck with the migration!** 🚀

If you encounter any issues not covered in this plan, refer to:
- shadcn/ui documentation
- Project's existing documentation
- Git history for context
- Create detailed issue reports for complex problems

---

*End of Migration Plan*
