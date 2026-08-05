# Task: Always Use "مدينة" Prefix in Display Names

**Priority:** LOW  
**Risk Level:** LOW (cosmetic change, no data modification)  
**Estimated Time:** 10 minutes

---

## Context

Currently, the `composeDisplayName()` function uses the city's `type` field from the database to generate display names:

```typescript
// Current behavior:
composeDisplayName("مكة المكرمة", "مدينة", "الخضراء", null)
→ "نقطة بيع مدينة مكة المكرمة حي الخضراء" ✅

composeDisplayName("الليث", "منطقة", null, null)
→ "نقطة بيع منطقة الليث" ⚠️

composeDisplayName("عفيف", "محافظة", null, null)
→ "نقطة بيع محافظة عفيف" ⚠️
```

**New requirement:** Always use "مدينة" prefix, regardless of what's stored in the database.

```typescript
// Desired behavior:
composeDisplayName("مكة المكرمة", "مدينة", "الخضراء", null)
→ "نقطة بيع مدينة مكة المكرمة حي الخضراء" ✅

composeDisplayName("الليث", "منطقة", null, null)
→ "نقطة بيع مدينة الليث" ✅ (changed)

composeDisplayName("عفيف", "محافظة", null, null)
→ "نقطة بيع مدينة عفيف" ✅ (changed)
```

---

## Objective

Modify `composeDisplayName()` to **always use "مدينة"** as the city type prefix, ignoring the `cityType` parameter.

**Rationale:** The user wants a consistent UI format where all cities are prefixed with "مدينة", regardless of their administrative classification in the database.

---

## Implementation

### Option 1: Ignore cityType Parameter (Simplest)

**File:** `lib/points.ts`

**Current code:**
```typescript
export function composeDisplayName(
  cityName: string,
  cityType: string,
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع ' + cityType + ' ' + cityName  // Uses cityType parameter
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

**New code:**
```typescript
export function composeDisplayName(
  cityName: string,
  cityType: string,  // Keep parameter for backward compatibility, but don't use it
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع مدينة ' + cityName  // Always use "مدينة"
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

**Update JSDoc comment:**
```typescript
/**
 * Compose the human-readable sales-point name. UI-only — never persisted.
 * Always prefixes city with "مدينة" regardless of stored city type.
 *   "نقطة بيع مدينة " + city + (" حي " + neighborhood | " " + extraLabel | "")
 */
```

---

### Option 2: Remove cityType Parameter Entirely (Cleaner)

If you want to clean up the signature completely:

**File:** `lib/points.ts`

```typescript
/**
 * Compose the human-readable sales-point name. UI-only — never persisted.
 * Always prefixes city with "مدينة".
 *   "نقطة بيع مدينة " + city + (" حي " + neighborhood | " " + extraLabel | "")
 */
export function composeDisplayName(
  cityName: string,
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع مدينة ' + cityName  // Always "مدينة"
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

**Then update all call sites to remove the `cityType` argument:**

#### `app/api/sales-points/route.ts`
```typescript
// OLD:
displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),

// NEW:
displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
```

#### `app/(public)/page.tsx`
```typescript
// OLD:
displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),

// NEW:
displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
```

#### `app/(public)/location/[id]/page.tsx`
Update **both** occurrences (in `generateMetadata` and `LocationDetailPage`):

```typescript
// OLD:
const displayName = composeDisplayName(cityName, cityType, neighborhoodName, extraLabel)

// NEW:
const displayName = composeDisplayName(cityName, neighborhoodName, extraLabel)
```

---

## Recommendation

**Use Option 1** (ignore parameter but keep signature) because:
- ✅ Simpler - only 1 file to change
- ✅ Faster - no need to update 3 call sites
- ✅ Safer - no risk of TypeScript errors
- ✅ Backward compatible - if code elsewhere calls it, still works

**Or use Option 2** if you want:
- ✅ Cleaner API - parameter that isn't used shouldn't exist
- ✅ Future-proof - makes it clear cityType isn't needed
- ⚠️ More changes - need to update 4 call sites

---

## Implementation Steps (Option 1 - Recommended)

### Step 1: Update composeDisplayName Function

**File:** `lib/points.ts`

Find this function:
```typescript
export function composeDisplayName(
  cityName: string,
  cityType: string,
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع ' + cityType + ' ' + cityName
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

Replace with:
```typescript
/**
 * Compose the human-readable sales-point name. UI-only — never persisted.
 * Always prefixes city with "مدينة" regardless of stored city type.
 *   "نقطة بيع مدينة " + city + (" حي " + neighborhood | " " + extraLabel | "")
 */
export function composeDisplayName(
  cityName: string,
  cityType: string,  // Kept for backward compatibility but unused
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع مدينة ' + cityName  // Always use "مدينة"
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

**That's it! No other changes needed.**

---

### Step 2: Verify TypeScript Compiles

```bash
npx tsc --noEmit
```

Should have no errors.

---

### Step 3: Test Locally (Optional)

If you want to verify before deploying:

```bash
npm run dev
```

Visit the site and check:
- Homepage: All sales points should show "نقطة بيع مدينة [city]"
- Detail pages: Titles should show "نقطة بيع مدينة [city]"
- Specifically check:
  - الليث → should now show "نقطة بيع مدينة الليث" (not "منطقة")
  - عفيف → should now show "نقطة بيع مدينة عفيف" (not "محافظة")

---

### Step 4: Commit and Push

```bash
git add lib/points.ts
git commit -m "fix: always use مدينة prefix in display names

Changed composeDisplayName to always prefix city names with 'مدينة'
regardless of stored city type. Ensures consistent UI format across
all sales points.

Affects display only - no database changes."

git push origin main
```

---

### Step 5: Verify Production After Deploy

Wait for Vercel deployment, then check:

```bash
# Check API response
curl https://special-car-points.vercel.app/api/sales-points | jq '.[] | select(.cityName | contains("الليث") or contains("عفيف")) | {cityName, displayName}'
```

**Expected output:**
```json
{
  "cityName": "الليث",
  "displayName": "نقطة بيع مدينة الليث"
}
{
  "cityName": "عفيف",
  "displayName": "نقطة بيع مدينة عفيف"
}
```

(Previously would have shown "منطقة" and "محافظة")

---

## Alternative: Option 2 Implementation (If You Prefer)

If you prefer to remove the unused parameter completely:

### Files to Change:

1. **`lib/points.ts`** - Remove `cityType` parameter
2. **`app/api/sales-points/route.ts`** - Remove `cityType` argument
3. **`app/(public)/page.tsx`** - Remove `cityType` argument
4. **`app/(public)/location/[id]/page.tsx`** - Remove `cityType` argument (2 places)

### Changes:

**1. lib/points.ts:**
```typescript
export function composeDisplayName(
  cityName: string,
  // cityType parameter removed
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع مدينة ' + cityName
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

**2. app/api/sales-points/route.ts (GET handler):**
```typescript
displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
// Removed cityType argument
```

**3. app/(public)/page.tsx:**
```typescript
displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
// Removed cityType argument
```

**4. app/(public)/location/[id]/page.tsx (2 places):**

In `generateMetadata`:
```typescript
const displayName = composeDisplayName(cityName, neighborhoodName, extraLabel)
// Removed cityType argument
```

In `LocationDetailPage`:
```typescript
const displayName = composeDisplayName(cityName, neighborhoodName, extraLabel)
// Removed cityType argument
```

---

## Impact Analysis

### User-Facing Changes:

**Before:**
- "نقطة بيع منطقة الليث"
- "نقطة بيع محافظة عفيف"
- "نقطة بيع مدينة مكة المكرمة حي الخضراء"

**After:**
- "نقطة بيع مدينة الليث" ✅ (changed)
- "نقطة بيع مدينة عفيف" ✅ (changed)
- "نقطة بيع مدينة مكة المكرمة حي الخضراء" ✅ (unchanged)

### SEO Impact:

- **Minimal** - Only 2 cities affected (الليث, عفيف)
- Page titles and meta descriptions will update
- Google will re-index over time
- No broken links

### Database Impact:

- **None** - This is purely a display change
- The `cities.type` field remains unchanged
- No migration needed

### Code Impact:

- **Option 1:** 1 file changed (lib/points.ts)
- **Option 2:** 4 files changed (lib/points.ts + 3 call sites)

---

## Testing Checklist

After deploying:

- [ ] Homepage displays all sales points with "مدينة" prefix
- [ ] Detail pages show "مدينة" in `<h1>` tag
- [ ] Browser tab title shows "مدينة"
- [ ] API returns `displayName` with "مدينة"
- [ ] Search still works
- [ ] VIP filter still works
- [ ] الليث shows "مدينة الليث" (not "منطقة")
- [ ] عفيف shows "مدينة عفيف" (not "محافظة")
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console

---

## Rollback Plan

If you need to revert:

```bash
git revert HEAD
git push origin main
```

This will restore the previous behavior (using city type from database).

---

## Questions to Consider

### Why keep the `type` field in the database?

You might ask: "If we're not using the `type` field anymore, why keep it?"

**Answer:** You have options:

**Option A: Keep it**
- Maybe useful for future features (filtering by type, analytics, etc.)
- No harm in keeping extra metadata
- Already populated, no work to remove

**Option B: Remove it**
- Simplify schema
- Run migration to remove `type` field from all cities
- Update City interface to remove `type`

For now, I recommend **Option A** (keep it) - it's metadata that might be useful later, and removing it requires another migration.

### What if requirements change again?

If you later decide you DO want to show different types, you can easily change back by:
- Reverting the commit
- Or modifying the function to use `cityType` again

---

## Summary

**Simplest approach (Recommended):**
1. Edit `lib/points.ts` - change one line: `'نقطة بيع مدينة ' + cityName`
2. Update JSDoc comment
3. Commit and push
4. Verify after deployment

**Total time: 5 minutes**

**Result:** All cities display with "مدينة" prefix consistently.
