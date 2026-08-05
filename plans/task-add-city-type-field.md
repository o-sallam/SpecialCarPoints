# Task: Add City Type Field for Proper Display Name Composition

## Context

Currently, `composeDisplayName()` generates display names like:
```
نقطة بيع + cityName + (neighborhood | extraLabel)
```

But two cities in the database are **type-exception cases** that should not use the generic "مدينة" prefix:
- **الليث** → should be "نقطة بيع **منطقة** الليث" (not "نقطة بيع مدينة الليث")
- **عـفيف** → should be "نقطة بيع **محافظة** عـفيف" (not "نقطة بيع مدينة عـفيف")

This information exists in the legacy `name`/`location` fields (see `data.json` lines 267, 529) but will be lost when those fields are removed per the cleanup plan.

**This task must be completed BEFORE running the field-removal cleanup**, or the type distinction will be permanently lost.

---

## Objective

1. **Add `type` field to the `City` interface and collection**
   - Values: `"مدينة"` (default) | `"محافظة"` | `"منطقة"`
   - Store as an explicit field instead of embedding it in the name

2. **Populate `type` field for all existing cities**
   - الليث → `"منطقة"`
   - عـفيف → `"محافظة"`  
   - All other cities → `"مدينة"` (default)

3. **Update `composeDisplayName()` to use the `type` field**
   - Generate: `"نقطة بيع " + city.type + " " + city.name + ...`
   - Example: `"نقطة بيع منطقة الليث"`, `"نقطة بيع محافظة عـفيف"`, `"نقطة بيع مدينة الرياض حي السويدي"`

4. **Update all code paths that call `composeDisplayName()`**
   - Pass `cityType` alongside `cityName`
   - Ensure type is retrieved from database joins

---

## Implementation Steps

### Step 1: Update TypeScript Interfaces

**File:** `lib/types.ts`

Add `type` field to the `City` interface:

```typescript
export interface City {
  _id: ObjectId
  name: string
  type: 'مدينة' | 'محافظة' | 'منطقة'  // ADD THIS
  createdAt: Date
  updatedAt: Date
}
```

---

### Step 2: Update Database Schema (Migration)

Add `type` field to all existing cities in the database.

**File:** Create `scripts/add-city-type-field.ts`

```typescript
/**
 * Migration: Add `type` field to all cities in the database
 * Must run BEFORE the legacy field cleanup to preserve type information
 */

import { connectToDatabase } from '@/lib/mongodb'

async function main() {
  const { db } = await connectToDatabase()
  
  console.log('Adding type field to cities collection...')
  
  // Type exceptions - these have explicit type prefixes in legacy data
  const typeExceptions = [
    { name: 'الليث', type: 'منطقة' },
    { name: 'عـفيف', type: 'محافظة' },
    // Note: handle different spellings of عفيف if they exist
    { name: 'عفيف', type: 'محافظة' },
  ]
  
  // Update type exceptions
  for (const { name, type } of typeExceptions) {
    const result = await db.collection('cities').updateMany(
      { name: name },
      { $set: { type: type, updatedAt: new Date() } }
    )
    console.log(`Updated ${result.matchedCount} city: ${name} → type: ${type}`)
  }
  
  // Update all remaining cities to default type "مدينة"
  const defaultResult = await db.collection('cities').updateMany(
    { type: { $exists: false } },
    { $set: { type: 'مدينة', updatedAt: new Date() } }
  )
  
  console.log(`Updated ${defaultResult.modifiedCount} cities to default type: مدينة`)
  
  // Verification
  const counts = await db.collection('cities').aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray()
  
  console.log('\nFinal type distribution:')
  counts.forEach(({ _id, count }) => {
    console.log(`  ${_id}: ${count}`)
  })
  
  // Check for any cities still missing type field
  const missing = await db.collection('cities').countDocuments({ type: { $exists: false } })
  if (missing > 0) {
    console.warn(`\n⚠️  WARNING: ${missing} cities still missing type field!`)
  } else {
    console.log('\n✅ All cities now have type field')
  }
  
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
```

**Run command:**
```bash
npx tsx scripts/add-city-type-field.ts
```

---

### Step 3: Update `composeDisplayName()` Function

**File:** `lib/points.ts`

Update the function signature and implementation:

```typescript
/**
 * Compose the human-readable sales-point name. UI-only — never persisted.
 *   "نقطة بيع " + cityType + " " + city + (" حي " + neighborhood | " " + extraLabel | "")
 */
export function composeDisplayName(
  cityName: string,
  cityType: string,                    // ADD THIS PARAMETER
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع ' + cityType + ' ' + cityName  // CHANGED: add type
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}
```

Also update the JSDoc comment above to reflect the new signature.

---

### Step 4: Update All Call Sites

Need to update every place that calls `composeDisplayName()` to pass the `cityType` parameter.

#### 4.1: API Route - `app/api/sales-points/route.ts`

**In `GET` handler:**

```typescript
// OLD:
const resolved = points.map((p: any) => {
  const cityName = (p.cityId && citiesById.get(String(p.cityId))?.name) || 'مدن أخرى'
  const neighborhoodName = p.neighborhoodId
    ? neighborhoodsById.get(String(p.neighborhoodId))?.name ?? null
    : null
  const extraLabel = p.extraLabel ?? null
  return {
    // ...
    displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
    // ...
  }
})

// NEW:
const resolved = points.map((p: any) => {
  const city = p.cityId ? citiesById.get(String(p.cityId)) : null
  const cityName = city?.name || 'مدن أخرى'
  const cityType = city?.type || 'مدينة'  // ADD THIS
  const neighborhoodName = p.neighborhoodId
    ? neighborhoodsById.get(String(p.neighborhoodId))?.name ?? null
    : null
  const extraLabel = p.extraLabel ?? null
  return {
    // ...
    displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),  // CHANGED
    // ...
  }
})
```

---

#### 4.2: Home Page - `app/(public)/page.tsx`

```typescript
// OLD:
points = docs.map((p: any) => {
  const s = p.socialLinks || {}
  const cityName = (p.cityId && citiesById.get(String(p.cityId))?.name) || 'مدن أخرى'
  const neighborhoodName = p.neighborhoodId
    ? neighborhoodsById.get(String(p.neighborhoodId))?.name ?? null
    : null
  const extraLabel = p.extraLabel ?? null
  return {
    // ...
    displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
    // ...
  }
})

// NEW:
points = docs.map((p: any) => {
  const s = p.socialLinks || {}
  const city = p.cityId ? citiesById.get(String(p.cityId)) : null
  const cityName = city?.name || 'مدن أخرى'
  const cityType = city?.type || 'مدينة'  // ADD THIS
  const neighborhoodName = p.neighborhoodId
    ? neighborhoodsById.get(String(p.neighborhoodId))?.name ?? null
    : null
  const extraLabel = p.extraLabel ?? null
  return {
    // ...
    displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),  // CHANGED
    // ...
  }
})
```

---

#### 4.3: Detail Page - `app/(public)/location/[id]/page.tsx`

Update **both** `generateMetadata()` and `LocationDetailPage()`:

**In `generateMetadata()`:**
```typescript
// OLD:
const cityName = (doc.cityId && citiesById.get(String(doc.cityId))?.name) || ''
const neighborhoodName = doc.neighborhoodId
  ? neighborhoodsById.get(String(doc.neighborhoodId))?.name ?? null
  : null
const extraLabel = doc.extraLabel ?? null
const displayName = composeDisplayName(cityName, neighborhoodName, extraLabel)

// NEW:
const city = doc.cityId ? citiesById.get(String(doc.cityId)) : null
const cityName = city?.name || ''
const cityType = city?.type || 'مدينة'  // ADD THIS
const neighborhoodName = doc.neighborhoodId
  ? neighborhoodsById.get(String(doc.neighborhoodId))?.name ?? null
  : null
const extraLabel = doc.extraLabel ?? null
const displayName = composeDisplayName(cityName, cityType, neighborhoodName, extraLabel)  // CHANGED
```

**In `LocationDetailPage()` body:**
```typescript
// OLD:
const cityName = (doc.cityId && citiesById.get(String(doc.cityId))?.name) || 'مدن أخرى'
const neighborhoodName = doc.neighborhoodId
  ? neighborhoodsById.get(String(doc.neighborhoodId))?.name ?? null
  : null
const extraLabel = doc.extraLabel ?? null
const displayName = composeDisplayName(cityName, neighborhoodName, extraLabel)

// NEW:
const city = doc.cityId ? citiesById.get(String(doc.cityId)) : null
const cityName = city?.name || 'مدن أخرى'
const cityType = city?.type || 'مدينة'  // ADD THIS
const neighborhoodName = doc.neighborhoodId
  ? neighborhoodsById.get(String(doc.neighborhoodId))?.name ?? null
  : null
const extraLabel = doc.extraLabel ?? null
const displayName = composeDisplayName(cityName, cityType, neighborhoodName, extraLabel)  // CHANGED
```

---

#### 4.4: Update POSEntry Interface

**File:** `lib/points.ts`

The `POSEntry` interface should also reflect that cityType is part of the entry:

```typescript
/** A single point-of-sale entry, normalized for the UI. */
export interface POSEntry {
  _id: string
  cityId: string
  cityName: string
  cityType: string          // ADD THIS - make it explicit
  neighborhoodId: string | null
  neighborhoodName: string | null
  extraLabel: string | null
  /** composed display name, e.g. "نقطة بيع مدينة الرياض حي السويدي" */
  displayName: string
  vip: boolean
  googleMapUrl: string
  lat: number | null
  lng: number | null
  /** free-form contact fields; empty string when absent */
  whatsapp?: string
  email?: string
  phone?: string
}
```

Then ensure all the places building POSEntry objects include `cityType`:

**In `app/api/sales-points/route.ts` GET:**
```typescript
return {
  _id: p._id.toString(),
  cityId: p.cityId?.toString() ?? '',
  cityName,
  cityType,  // ADD THIS
  neighborhoodId: p.neighborhoodId ? String(p.neighborhoodId) : null,
  neighborhoodName,
  extraLabel,
  displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),
  vip: p.vip,
  googleMapUrl: p.googleMapUrl,
  lat: p.lat ?? null,
  lng: p.lng ?? null,
}
```

**In `app/(public)/page.tsx`:**
```typescript
return {
  _id: p._id.toString(),
  cityId: p.cityId?.toString() ?? '',
  cityName,
  cityType,  // ADD THIS
  neighborhoodId: p.neighborhoodId ? String(p.neighborhoodId) : null,
  neighborhoodName,
  extraLabel,
  displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),
  vip: p.vip,
  googleMapUrl: p.googleMapUrl,
  lat: p.lat ?? null,
  lng: p.lng ?? null,
  whatsapp: s.whatsapp || '',
  email: s.email || '',
  phone: '',
}
```

---

### Step 5: Update City CRUD Operations

**File:** `lib/data/cities.ts`

Update `createCity()` to set default type:

```typescript
/** Create a city, then bust the "cities" cache. */
export async function createCity(input: { 
  name: string
  type?: 'مدينة' | 'محافظة' | 'منطقة'  // ADD THIS - optional, defaults to مدينة
}): Promise<City> {
  const { db } = await connectToDatabase()
  const now = new Date()
  const doc = { 
    name: input.name.trim(),
    type: input.type || 'مدينة',  // ADD THIS
    createdAt: now,
    updatedAt: now,
  }
  const res = await db.collection('cities').insertOne(doc)
  revalidateTag('cities')
  return { _id: res.insertedId, ...doc }
}
```

Update `updateCity()` to allow updating type:

```typescript
/** Update a city by id. Returns the updated doc, or null if not found. */
export async function updateCity(
  id: string,
  patch: { 
    name?: string
    type?: 'مدينة' | 'محافظة' | 'منطقة'  // ADD THIS
  }
): Promise<City | null> {
  const { db } = await connectToDatabase()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) set[k] = v
  }
  const res = await db.collection('cities').updateOne({ _id: new ObjectId(id) }, { $set: set })
  if (res.matchedCount === 0) return null
  revalidateTag('cities')
  const doc = await db.collection('cities').findOne({ _id: new ObjectId(id) })
  return (doc ?? null) as City | null
}
```

---

### Step 6: Verification

After implementing all changes:

#### 6.1: Verify Database State

```javascript
// In MongoDB shell or Compass
db.cities.find({}, { name: 1, type: 1 }).sort({ name: 1 })

// Should show:
// - الليث: منطقة
// - عـفيف: محافظة
// - All others: مدينة

// Verify no missing types
db.cities.countDocuments({ type: { $exists: false } })
// Should return 0
```

#### 6.2: Test Display Names

Check these specific sales points on the live site (after deploy):

1. **الليث** sales point → should show "نقطة بيع منطقة الليث"
2. **عـفيف** sales point → should show "نقطة بيع محافظة عـفيف"
3. **Regular city** (e.g., مكة) → should show "نقطة بيع مدينة مكة المكرمة حي [neighborhood]"

#### 6.3: Test API Response

```bash
curl http://localhost:3000/api/sales-points | jq '.[] | select(.cityName | contains("الليث") or contains("عفيف")) | {cityName, cityType, displayName}'
```

Expected output should include `cityType` field with correct values.

---

## Testing Checklist

- [ ] Run migration script - all cities have `type` field
- [ ] Verify type distribution (2 exception cases + rest as مدينة)
- [ ] TypeScript compiles with no errors
- [ ] Home page loads and displays correct names for all types
- [ ] Detail pages show correct names in:
  - [ ] Page title (`<h1>`)
  - [ ] Browser tab (`<title>`)
  - [ ] Meta description
- [ ] API `/api/sales-points` returns `cityType` in response
- [ ] Search still works with new display names
- [ ] VIP filter still works
- [ ] Admin forms can create/edit cities (with optional type selection)

---

## Dependencies and Sequencing

### Before This Task:
- ✅ Task 8 must be complete (dynamic name composition already implemented)
- ✅ Cities/neighborhoods collections must exist and be populated

### After This Task:
- Ready to run the legacy field cleanup (remove name/location/neighborhood/districtId)
- Type information preserved in structured `type` field instead of embedded in legacy text

### Deployment Order:
1. **Commit and push this task's code changes**
2. **Run the migration script in production** (adds `type` field to cities)
3. **Deploy the updated code** (new `composeDisplayName` signature)
4. **Verify the site renders correctly** for all city types
5. **Then proceed with legacy field cleanup** (Step 5 of the cleanup plan)

---

## Rollback Plan

If issues are discovered after deploying:

### Rollback Code:
```bash
git revert <commit-hash>
git push
```

### Rollback Database (if needed):
The `type` field addition is non-destructive — old code simply ignores it. No rollback needed unless you want to remove it:

```javascript
// Remove type field from all cities (not recommended unless rolling back completely)
db.cities.updateMany(
  {},
  { $unset: { type: "" } }
)
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `lib/types.ts` | Add `type` field to `City` interface |
| `lib/points.ts` | Update `composeDisplayName()` signature, add `cityType` to `POSEntry` |
| `lib/data/cities.ts` | Support `type` in create/update operations |
| `app/api/sales-points/route.ts` | Pass `cityType` to `composeDisplayName()` |
| `app/(public)/page.tsx` | Pass `cityType` to `composeDisplayName()` |
| `app/(public)/location/[id]/page.tsx` | Pass `cityType` in metadata + page body |
| `scripts/add-city-type-field.ts` | **New file** - Migration script |

**Total: 7 files** (6 modified + 1 new)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration script sets wrong type | **LOW** - Only 2 exception cases | Manual verification after migration |
| Function signature change breaks something | **MEDIUM** - All call sites must be updated | TypeScript will catch missing args at compile time |
| Display names render incorrectly | **MEDIUM** - User-facing | Test all city types before deploying |
| Old code deployed with new DB schema | **LOW** - Type field just ignored | Non-breaking change |

---

## Success Criteria

✅ All cities have a `type` field in the database  
✅ Display names correctly show "منطقة" for الليث and "محافظة" for عـفيف  
✅ Display names correctly show "مدينة" for all other cities  
✅ No TypeScript compilation errors  
✅ All pages render correctly for all city types  
✅ Ready to proceed with legacy field cleanup without losing type information
