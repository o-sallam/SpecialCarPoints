# Task: Remove Legacy Fields from sales_points Collection

**Priority:** HIGH  
**Risk Level:** MEDIUM (requires production deploy verification first)  
**Estimated Time:** 15 minutes (after deploy confirmed)

---

## Context

The `sales_points` collection currently contains **duplicated legacy fields** that should no longer exist:

```javascript
// Current state (WRONG):
{
  _id: ObjectId("6a4d8d9367cc1a5aff582a93"),
  legacyId: "501608213",
  name: "نقطة بيع مدينة مكـة المكرمـة حي الخضراء",      // ❌ REMOVE
  location: "نقطة بيع مدينة مكـة المكرمـة",             // ❌ REMOVE
  neighborhood: "حي الخضراء",                           // ❌ REMOVE
  districtId: ObjectId("6a715b8bef456f59d48c6913"),    // ❌ REMOVE
  cityId: ObjectId("6a738f1041806196c135c642"),        // ✅ KEEP
  neighborhoodId: ObjectId("6a738f1641806196c135c65e"), // ✅ KEEP
  extraLabel: null,                                     // ✅ KEEP
  googleMapUrl: "...",                                  // ✅ KEEP
  vip: true,                                            // ✅ KEEP
  // ... rest
}
```

**Why these fields exist:** They were migrated from the old schema and kept temporarily while new code was being deployed.

**Why they must be removed:** 
- They duplicate information that should be computed from `cityId` + `neighborhoodId`
- They create data inconsistency risk
- The application now computes display names dynamically via `composeDisplayName()`

---

## Objective

Remove these 4 legacy fields from **all** `sales_points` documents:
1. `name` - duplicates computed display name
2. `location` - duplicates city name
3. `neighborhood` - duplicates neighborhood name
4. `districtId` - no longer used (we have `cityId` instead)

**After cleanup, display names are ONLY computed at runtime** by joining:
```
City.type + City.name + Neighborhood.name → "نقطة بيع مدينة مكة المكرمة حي الخضراء"
```

---

## ⚠️ CRITICAL PRECONDITION

**DO NOT PROCEED** until you verify:

### ✅ Precondition: New Code Deployed to Production

The new code (Task 8 + city type) **MUST be live in production** before running this cleanup.

**How to verify:**

1. **Check Vercel deployment dashboard**
   - Latest commit should be deployed
   - Build status: Success
   - No deployment errors

2. **Test live site API:**
   ```bash
   curl https://your-production-domain.com/api/sales-points | jq '.[0] | {cityName, cityType, displayName}'
   ```
   
   Expected output (if new code is live):
   ```json
   {
     "cityName": "مكة المكرمة",
     "cityType": "مدينة",
     "displayName": "نقطة بيع مدينة مكة المكرمة حي الخضراء"
   }
   ```
   
   If you see `cityType` in the response, the new code is live ✅
   
   If `cityType` is missing, **STOP** and deploy first ❌

3. **Spot-check live pages:**
   - Visit homepage: Do sales points show with computed names?
   - Visit a detail page: Does the `<h1>` show the computed name?
   - Check browser console: Any errors?

**If any of the above fail, STOP HERE and fix deployment first.**

---

## Implementation Steps

### Step 0: Final Pre-flight Check

Before touching the database, verify one last time:

```javascript
// MongoDB shell or Compass
// Count how many documents will be affected
db.sales_points.countDocuments({
  $or: [
    { name: { $exists: true } },
    { location: { $exists: true } },
    { neighborhood: { $exists: true } },
    { districtId: { $exists: true } }
  ]
})

// Should return ~55 (all sales points)
```

---

### Step 1: Backup Database

**CRITICAL:** Create a backup before making changes.

```bash
# Export sales_points collection
mongoexport --uri="$MONGODB_URI" \
  --collection=sales_points \
  --out=backup_sales_points_before_cleanup_$(date +%Y%m%d_%H%M%S).json

# Or use mongodump for full backup
mongodump --uri="$MONGODB_URI" \
  --collection=sales_points \
  --out=./backup_before_cleanup_$(date +%Y%m%d_%H%M%S)
```

**Verify backup exists:**
```bash
ls -lh backup_sales_points_*
# Should show file size > 0
```

**Keep this backup for at least 7 days** in case rollback is needed.

---

### Step 2: Preview the Change (Read-Only)

See what will be removed:

```javascript
// MongoDB shell or Compass
// Show 3 sample documents with legacy fields
db.sales_points.find(
  { name: { $exists: true } },
  { 
    _id: 1,
    legacyId: 1,
    name: 1,
    location: 1,
    neighborhood: 1,
    districtId: 1,
    cityId: 1,
    neighborhoodId: 1
  }
).limit(3).pretty()
```

**Example output:**
```javascript
{
  _id: ObjectId("6a4d8d9367cc1a5aff582a93"),
  legacyId: "501608213",
  name: "نقطة بيع مدينة مكـة المكرمـة حي الخضراء",    // Will be removed
  location: "نقطة بيع مدينة مكـة المكرمـة",           // Will be removed
  neighborhood: "حي الخضراء",                         // Will be removed
  districtId: ObjectId("6a715b8bef456f59d48c6913"),  // Will be removed
  cityId: ObjectId("6a738f1041806196c135c642"),      // Will stay
  neighborhoodId: ObjectId("6a738f1641806196c135c65e") // Will stay
}
```

Make sure you understand what's being removed before proceeding.

---

### Step 3: Remove Legacy Fields (DESTRUCTIVE)

**⚠️ POINT OF NO RETURN ⚠️**

Once you run this, the only way back is restoring from backup.

**Run the cleanup:**

```javascript
// MongoDB shell or Compass
const result = db.sales_points.updateMany(
  {},
  { 
    $unset: { 
      name: "",
      location: "",
      neighborhood: "",
      districtId: ""
    }
  }
)

print("Matched:", result.matchedCount)
print("Modified:", result.modifiedCount)
```

**Expected output:**
```
Matched: 55 (or however many sales points you have)
Modified: 55 (should equal matchedCount)
```

If `modifiedCount` is less than `matchedCount`, some documents might not have had those fields - that's OK.

---

### Step 4: Verify Cleanup Succeeded

**Check no documents still have legacy fields:**

```javascript
// Should return 0
db.sales_points.countDocuments({
  $or: [
    { name: { $exists: true } },
    { location: { $exists: true } },
    { neighborhood: { $exists: true } },
    { districtId: { $exists: true } }
  ]
})
```

**If this returns anything other than 0, investigate which documents still have fields:**

```javascript
db.sales_points.find({
  $or: [
    { name: { $exists: true } },
    { location: { $exists: true } },
    { neighborhood: { $exists: true } },
    { districtId: { $exists: true } }
  ]
}, { _id: 1, legacyId: 1, name: 1 })
```

---

### Step 5: Verify Production Site Still Works

**Immediately after cleanup, check the live site:**

1. **Homepage** (https://your-domain.com)
   - Sales points should still display with proper names
   - "نقطة بيع مدينة مكة المكرمة حي الخضراء" format
   - No blank cards or missing titles

2. **Detail pages** (click into a few sales points)
   - `<h1>` should show full computed name
   - Browser tab title should be correct
   - No "undefined" or blank text

3. **API endpoint**
   ```bash
   curl https://your-domain.com/api/sales-points | jq '.[0]'
   ```
   
   Should NOT contain `name`, `location`, `neighborhood`, `districtId` fields
   
   Should still have `displayName` (computed field)

4. **Search functionality**
   - Try searching for a city name
   - Try searching for a neighborhood name
   - Results should still appear

5. **VIP filter**
   - Toggle VIP filter on/off
   - Should still work

**If ANY of the above fail:**
- **STOP immediately**
- Check browser console for errors
- Check Vercel function logs for errors
- Consider rollback (see below)

---

### Step 6: Spot-Check Database Schema

Verify final document structure is clean:

```javascript
// Get one sample document
const sample = db.sales_points.findOne({})

print("Fields present:", Object.keys(sample).join(", "))

// Should see:
// _id, legacyId, cityId, neighborhoodId, extraLabel, 
// googleMapUrl, vip, lat, lng, socialLinks, createdAt, updatedAt

// Should NOT see:
// name, location, neighborhood, districtId
```

---

### Step 7: Monitor for Issues

**For the next 24 hours after cleanup:**

1. **Check Vercel function logs** for errors
   - Any MongoDB query errors?
   - Any undefined/null reference errors?

2. **Monitor user-facing behavior**
   - Test a few different sales points
   - Test different city types (مدينة, محافظة, منطقة)
   - Check mobile vs desktop rendering

3. **Check for cache issues**
   - New data should appear within 60 seconds (revalidate window)
   - If stale data persists, manually bust cache tags

---

## Rollback Plan

If issues are discovered after cleanup:

### Option A: Restore from Backup (Full Rollback)

```bash
# Using mongoexport backup
mongoimport --uri="$MONGODB_URI" \
  --collection=sales_points \
  --file=backup_sales_points_before_cleanup_TIMESTAMP.json \
  --drop

# Or using mongodump backup
mongorestore --uri="$MONGODB_URI" \
  --collection=sales_points \
  ./backup_before_cleanup_TIMESTAMP/special_car/sales_points.bson \
  --drop
```

This completely replaces the collection with the backup.

### Option B: Restore Specific Documents

If only certain documents are problematic:

```javascript
// Restore fields to a specific document from your backup
db.sales_points.updateOne(
  { _id: ObjectId("6a4d8d9367cc1a5aff582a93") },
  {
    $set: {
      name: "نقطة بيع مدينة مكـة المكرمـة حي الخضراء",
      location: "نقطة بيع مدينة مكـة المكرمـة",
      neighborhood: "حي الخضراء",
      districtId: ObjectId("6a715b8bef456f59d48c6913")
    }
  }
)
```

---

## Expected Results

### Before Cleanup:
```javascript
{
  _id: ObjectId("..."),
  legacyId: "501608213",
  name: "نقطة بيع مدينة مكـة المكرمـة حي الخضراء",
  location: "نقطة بيع مدينة مكـة المكرمـة",
  neighborhood: "حي الخضراء",
  districtId: ObjectId("..."),
  cityId: ObjectId("..."),
  neighborhoodId: ObjectId("..."),
  extraLabel: null,
  googleMapUrl: "...",
  vip: true,
  lat: 21.4535618,
  lng: 39.9414698,
  socialLinks: {...},
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### After Cleanup:
```javascript
{
  _id: ObjectId("..."),
  legacyId: "501608213",
  cityId: ObjectId("..."),
  neighborhoodId: ObjectId("..."),
  extraLabel: null,
  googleMapUrl: "...",
  vip: true,
  lat: 21.4535618,
  lng: 39.9414698,
  socialLinks: {...},
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**4 fields removed, everything else preserved.**

---

## Success Criteria

✅ All legacy fields removed from all sales_points documents  
✅ Live site still renders correctly with computed names  
✅ API returns displayName (computed) but not name/location/neighborhood (stored)  
✅ Search and filtering still work  
✅ No errors in browser console  
✅ No errors in Vercel function logs  
✅ Backup created and verified  

---

## Execution Checklist

Use this checklist while executing:

- [ ] **Precondition verified:** New code deployed to production
- [ ] **Precondition verified:** Live site API returns `cityType` field
- [ ] **Precondition verified:** Spot-checked pages render correctly
- [ ] **Step 1:** Database backup created and verified
- [ ] **Step 2:** Previewed what will be removed (looks correct)
- [ ] **Step 3:** Ran `updateMany` to remove legacy fields
- [ ] **Step 3:** Verified `matchedCount` and `modifiedCount` are reasonable
- [ ] **Step 4:** Verified no documents still have legacy fields (count = 0)
- [ ] **Step 5:** Checked homepage - renders correctly
- [ ] **Step 5:** Checked detail pages - render correctly
- [ ] **Step 5:** Checked API response - no legacy fields present
- [ ] **Step 5:** Tested search - still works
- [ ] **Step 5:** Tested VIP filter - still works
- [ ] **Step 6:** Checked final document schema - looks clean
- [ ] **Step 7:** Monitoring for next 24 hours

---

## Notes

- **Why keep `legacyId`?** It's used for URL backward compatibility (old URLs still work)
- **Why keep `extraLabel`?** It's intentionally stored - for city-only points or street names that aren't neighborhoods
- **Can I run this multiple times?** Yes, it's idempotent - running again does nothing if fields are already gone
- **What if I find a bug later?** You have the backup for 7 days - can rollback anytime

---

## Timeline

**Total time: ~15 minutes**

- Step 0: Pre-flight check (2 min)
- Step 1: Backup (3 min)
- Step 2: Preview (1 min)
- Step 3: Remove fields (1 min)
- Step 4: Verify cleanup (1 min)
- Step 5: Test live site (5 min)
- Step 6: Verify schema (1 min)
- Step 7: Monitor ongoing (24 hours)

---

## When to Run This

**Ideal time:** During low-traffic hours (late night / early morning in your timezone)

**Why:** If something goes wrong, you have time to fix it before peak traffic.

**Required before running:**
- ✅ New code deployed to production
- ✅ New code verified working
- ✅ You have time to monitor for issues afterward

---

## Questions to Ask Before Starting

1. **Is the new code deployed?** → Check Vercel dashboard
2. **Is the new code working?** → Test live site
3. **Do I have a backup?** → Run Step 1 first
4. **Can I rollback if needed?** → Yes, restore from backup
5. **What if the site breaks?** → Rollback immediately, investigate after

If you can't answer "yes" to questions 1-4, **don't proceed yet.**

---

## Communication

After completing cleanup, report:

```
✅ Legacy field cleanup complete

Documents affected: 55
Fields removed per document: name, location, neighborhood, districtId
Backup created: backup_sales_points_before_cleanup_20260806_023000.json
Verification: All tests passed
Issues: None
Monitoring: Ongoing for 24h
```

---

## Final Warning

**This operation is destructive.** The only way to undo it is restoring from backup.

Make absolutely sure:
1. New code is deployed and working
2. You have a valid backup
3. You understand what's being removed

**When in doubt, wait.** Better to delay than to break production.
