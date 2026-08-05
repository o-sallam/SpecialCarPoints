# INSTRUCTION FOR CHEAPER LLM

**Task:** Remove legacy fields from `sales_points` collection  
**When:** After new code is deployed to production  
**Risk:** MEDIUM (requires backup + verification)

---

## Quick Context

The user is looking at a `sales_points` document in MongoDB Compass that still has these fields:
- `name`
- `location`
- `neighborhood`
- `districtId`

**These fields should not exist.** They're legacy duplicates that need to be removed.

The user said:
> "it should only have name and name should be calculated from neighborhoods and sales point names concat"

**Clarification:** The user means the display name should be **computed**, not **stored**. The database should NOT have a `name` field at all.

---

## What You Need to Do

### Step 1: Verify Deployment First

**CRITICAL:** Do NOT proceed until new code is deployed to production.

Check:
```bash
# Test the live API
curl https://your-production-domain.com/api/sales-points | jq '.[0] | {cityName, cityType, displayName}'
```

If you see `cityType` in the response → new code is live ✅  
If `cityType` is missing → STOP, deploy first ❌

### Step 2: Follow the Task File

Open and follow: **`plans/task-cleanup-legacy-sales-points-fields.md`**

Key steps:
1. Create backup (CRITICAL)
2. Preview what will be removed
3. Run the `$unset` operation
4. Verify fields are gone
5. Test live site still works

### Step 3: Report Results

After completion, report:
- How many documents affected
- Verification results (count should be 0)
- Live site test results

---

## Files to Read

1. **`plans/task-cleanup-legacy-sales-points-fields.md`** - Complete implementation steps
2. **`plans/visual-guide-display-names.md`** - Explains how display names work

---

## What Success Looks Like

### Before (Current State - WRONG):
```javascript
{
  _id: ObjectId("..."),
  name: "نقطة بيع مدينة مكـة المكرمـة حي الخضراء",    // ❌ Remove
  location: "نقطة بيع مدينة مكـة المكرمـة",           // ❌ Remove
  neighborhood: "حي الخضراء",                         // ❌ Remove
  districtId: ObjectId("..."),                        // ❌ Remove
  cityId: ObjectId("..."),                            // ✅ Keep
  neighborhoodId: ObjectId("..."),                    // ✅ Keep
  extraLabel: null,                                   // ✅ Keep
  googleMapUrl: "...",                                // ✅ Keep
  // ...rest of fields
}
```

### After (Target State - CORRECT):
```javascript
{
  _id: ObjectId("..."),
  cityId: ObjectId("..."),           // ✅ Keep
  neighborhoodId: ObjectId("..."),   // ✅ Keep
  extraLabel: null,                  // ✅ Keep
  googleMapUrl: "...",               // ✅ Keep
  // ...rest of fields
  
  // name, location, neighborhood, districtId are GONE
}
```

### API Response (Should Be Identical Before/After):
```json
{
  "_id": "...",
  "cityName": "مكة المكرمة",
  "cityType": "مدينة",
  "neighborhoodName": "الخضراء",
  "displayName": "نقطة بيع مدينة مكة المكرمة حي الخضراء",
  "vip": true,
  "googleMapUrl": "..."
}
```

**Note:** `displayName` is computed at runtime, not stored in database.

---

## Critical Warnings

1. **DO NOT proceed without deployment verification**
2. **DO NOT skip the backup step**
3. **DO NOT panic if something goes wrong** - restore from backup
4. **DO understand what you're removing** - read the visual guide first

---

## Questions?

If anything is unclear:
1. Read `plans/visual-guide-display-names.md` for conceptual understanding
2. Read `plans/task-cleanup-legacy-sales-points-fields.md` for step-by-step
3. Ask the user if still unclear

---

## Expected Timeline

- Deployment verification: 2 min
- Backup creation: 3 min
- Running cleanup: 2 min
- Verification: 5 min
- **Total: ~15 minutes**

---

Good luck! This is a straightforward cleanup operation as long as you:
1. Verify deployment first
2. Create backup
3. Follow the steps exactly
4. Verify results

The task file has everything you need.
