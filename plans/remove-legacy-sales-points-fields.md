# Plan: Remove Legacy Fields from sales_points Collection

## Objective
Clean up all `sales_points` documents by removing duplicated legacy fields. Display names should always be computed dynamically from related `City` and `Neighborhood` documents instead of being stored.

## Current State
`sales_points` documents currently contain these legacy fields:
- `name` - duplicates computed display name
- `location` - duplicates city name
- `neighborhood` - duplicates neighborhood name  
- `districtId` - may no longer be required

## Target State
`sales_points` documents should only store:
- References: `cityId`, `neighborhoodId`
- Sales-point-specific metadata: `legacyId`, `googleMapsUrl`, etc.
- **No duplicated name/location data**

Display names should be computed at runtime by joining:
```
نقطة بيع + City.type + City.name + Neighborhood.name
```

Example: `نقطة بيع مدينة مكة المكرمة حي الخضراء`

---

## Pre-flight Checks

### ✅ Required Before Proceeding

1. **Verify Task 8 Code is Deployed to Production**
   - Task 8 implements dynamic name computation in the application layer
   - If old code is still live, removing `name`/`location`/`neighborhood` will break the site
   - **Action**: Confirm with deployment team or check production deployment logs
   - **Alternative**: Test with 1-2 canary documents first (see Step 4 below)

2. **Verify Data Integrity**
   - Ensure all `sales_points` have valid `cityId` and `neighborhoodId` references
   - Ensure all referenced cities/neighborhoods exist in their collections
   - **Action**: Run validation query (see Step 1 below)

3. **Backup Current State**
   - Export current `sales_points` collection before making changes
   - **Action**: Run backup command (see Step 2 below)

---

## Implementation Steps

### Step 1: Validate Data Integrity (Read-Only)

Run this query to check for orphaned references or missing required fields:

```javascript
// Check for sales_points without valid cityId or neighborhoodId
db.sales_points.find({
  $or: [
    { cityId: { $exists: false } },
    { cityId: null },
    { neighborhoodId: { $exists: false } },
    { neighborhoodId: null }
  ]
}).count()

// Should return 0 - if not, those documents need fixing first
```

```javascript
// Verify all cityId references point to existing cities
const orphanedCities = db.sales_points.aggregate([
  {
    $lookup: {
      from: "cities",
      localField: "cityId",
      foreignField: "_id",
      as: "city"
    }
  },
  { $match: { city: { $size: 0 } } },
  { $project: { legacyId: 1, cityId: 1 } }
]).toArray()

print("Orphaned city references:", orphanedCities.length)
orphanedCities
```

```javascript
// Verify all neighborhoodId references point to existing neighborhoods
const orphanedNeighborhoods = db.sales_points.aggregate([
  {
    $lookup: {
      from: "neighborhoods",
      localField: "neighborhoodId",
      foreignField: "_id",
      as: "neighborhood"
    }
  },
  { $match: { neighborhood: { $size: 0 } } },
  { $project: { legacyId: 1, neighborhoodId: 1 } }
]).toArray()

print("Orphaned neighborhood references:", orphanedNeighborhoods.length)
orphanedNeighborhoods
```

**Expected Result**: All counts should be 0. If not, fix orphaned references before proceeding.

---

### Step 2: Backup Current Data

```bash
# Export entire sales_points collection to JSON
mongoexport --db=special_car_points \
  --collection=sales_points \
  --out=backup_sales_points_$(date +%Y%m%d_%H%M%S).json

# Or create a MongoDB dump
mongodump --db=special_car_points \
  --collection=sales_points \
  --out=./backup_$(date +%Y%m%d_%H%M%S)
```

**Store this backup safely** - it's your rollback option if something goes wrong.

---

### Step 3: Preview the Changes (Read-Only)

See what will be affected:

```javascript
// Count total documents that will be modified
db.sales_points.countDocuments({
  $or: [
    { name: { $exists: true } },
    { location: { $exists: true } },
    { neighborhood: { $exists: true } },
    { districtId: { $exists: true } }
  ]
})

// Show a few sample documents before cleanup
db.sales_points.find(
  {
    $or: [
      { name: { $exists: true } },
      { location: { $exists: true } },
      { neighborhood: { $exists: true } },
      { districtId: { $exists: true } }
    ]
  },
  { name: 1, location: 1, neighborhood: 1, districtId: 1, legacyId: 1 }
).limit(5).pretty()
```

---

### Step 4: OPTIONAL - Canary Test (If Task 8 Deploy Status Unknown)

If you're not 100% sure Task 8 code is deployed, test with 1-2 documents first:

```javascript
// Find one normal مدينة case
const testDoc1 = db.sales_points.findOne(
  { name: /مكة/ },
  { name: 1, location: 1, neighborhood: 1, districtId: 1, legacyId: 1 }
)
print("Test doc 1:", JSON.stringify(testDoc1, null, 2))

// Find type-exception cases (محافظة/منطقة)
const testDoc2 = db.sales_points.findOne(
  { name: { $regex: /عفيف|الليث/ } },
  { name: 1, location: 1, neighborhood: 1, districtId: 1, legacyId: 1 }
)
print("Test doc 2:", JSON.stringify(testDoc2, null, 2))
```

**Save those outputs**, then remove fields from just those test documents:

```javascript
// Remove from test doc 1
db.sales_points.updateOne(
  { _id: testDoc1._id },
  { $unset: { name: "", location: "", neighborhood: "", districtId: "" } }
)

// Remove from test doc 2 (if found)
if (testDoc2) {
  db.sales_points.updateOne(
    { _id: testDoc2._id },
    { $unset: { name: "", location: "", neighborhood: "", districtId: "" } }
  )
}
```

**Immediately check the live site** for those specific sales points:
- If they render correctly with computed names → Task 8 is likely deployed ✅
- If they show blank/broken titles → Old code is still live ⚠️ (restore from saved values and wait for Task 8 deploy)

**Rollback test documents if needed:**
```javascript
db.sales_points.updateOne(
  { _id: testDoc1._id },
  { 
    $set: { 
      name: testDoc1.name,
      location: testDoc1.location,
      neighborhood: testDoc1.neighborhood,
      districtId: testDoc1.districtId
    }
  }
)
```

---

### Step 5: Remove Legacy Fields from All Documents

⚠️ **Only proceed if:**
- Task 8 code is confirmed deployed to production, OR
- Canary test (Step 4) showed the site renders correctly without those fields

```javascript
// Remove the 4 legacy fields from ALL sales_points documents
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

**Expected**: `matchedCount` should equal total document count, `modifiedCount` should equal documents that actually had those fields.

---

### Step 6: Verify Cleanup

```javascript
// Verify no documents still have the legacy fields
db.sales_points.countDocuments({
  $or: [
    { name: { $exists: true } },
    { location: { $exists: true } },
    { neighborhood: { $exists: true } },
    { districtId: { $exists: true } }
  ]
})
// Should return 0

// Sample check - see what remains in documents
db.sales_points.find({}).limit(3).pretty()

// Verify structure matches target state
db.sales_points.findOne({}, {
  cityId: 1,
  neighborhoodId: 1,
  legacyId: 1,
  googleMapsUrl: 1,
  name: 1,           // Should not exist
  location: 1,       // Should not exist
  neighborhood: 1,   // Should not exist
  districtId: 1      // Should not exist
})
```

---

### Step 7: Test Application Functionality

After cleanup, verify the application layer correctly computes display names:

1. **Frontend display**: Check that sales point cards/lists show computed names
2. **Detail pages**: Verify `<h1>` and page titles render correctly
3. **SEO meta tags**: Ensure `<title>` and meta descriptions use computed names
4. **API responses**: Confirm API endpoints return computed names in responses
5. **Edge cases**: Test type-exception cities (محافظة/منطقة like عفيف, الليث)

---

## Rollback Plan

If issues are discovered after cleanup:

### Option A: Restore from backup
```bash
# Restore from mongoexport backup
mongoimport --db=special_car_points \
  --collection=sales_points \
  --file=backup_sales_points_TIMESTAMP.json \
  --drop

# Or restore from mongodump
mongorestore --db=special_car_points \
  --collection=sales_points \
  ./backup_TIMESTAMP/special_car_points/sales_points.bson \
  --drop
```

### Option B: Re-add fields to specific documents
```javascript
// If you need to restore specific documents and have their original values
db.sales_points.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      name: "original value",
      location: "original value",
      neighborhood: "original value",
      districtId: ObjectId("...")
    }
  }
)
```

---

## Dependencies

### Must Be Complete Before This Cleanup:
- ✅ **Task 8**: Application layer must compute names dynamically from City + Neighborhood
  - Otherwise removing stored names will break the site

### Should Be Complete (But Not Blocking):
- **Step 0 of Task 6**: Add `type` field to Cities collection
  - This enables proper مدينة/محافظة/منطقة distinction in computed names
  - Can proceed without it, but computed names will be less accurate for type exceptions

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Task 8 code not deployed | **HIGH** - Site breaks for all sales points | Canary test first (Step 4) or confirm deploy status |
| Orphaned references | **MEDIUM** - Some sales points can't compute names | Data validation before cleanup (Step 1) |
| Backup failure | **MEDIUM** - No rollback option | Verify backup file exists and is valid before proceeding |
| Type field missing | **LOW** - Type-exception cities show generic "مدينة" | Acceptable temporarily; will be fixed when Task 6 Step 0 runs |

---

## Execution Checklist

- [ ] Confirm Task 8 is deployed to production
- [ ] Run data integrity validation (Step 1)
- [ ] Create and verify backup (Step 2)
- [ ] Preview changes (Step 3)
- [ ] *Optional*: Run canary test on 1-2 documents (Step 4)
- [ ] Remove legacy fields from all documents (Step 5)
- [ ] Verify cleanup completed successfully (Step 6)
- [ ] Test application functionality (Step 7)
- [ ] Keep backup for at least 30 days

---

## Notes

- **Total affected documents**: ~55 sales points (based on previous context)
- **Estimated execution time**: 5-10 minutes (excluding testing)
- **Reversibility**: Fully reversible via backup restore
- **Production impact**: Zero if Task 8 is deployed; complete breakage if not
- **Point of no return**: Step 5 (can safely abort before then)

