# Visual Guide: How Display Names Work

## The Key Concept

**Display names should NEVER be stored in the database.**  
**They should ALWAYS be computed at runtime.**

---

## Current State (Before Cleanup) - ❌ WRONG

### Database Document:
```javascript
{
  _id: ObjectId("6a4d8d9367cc1a5aff582a93"),
  legacyId: "501608213",
  
  // ❌ These fields duplicate information - MUST BE REMOVED
  name: "نقطة بيع مدينة مكـة المكرمـة حي الخضراء",
  location: "نقطة بيع مدينة مكـة المكرمـة",
  neighborhood: "حي الخضراء",
  districtId: ObjectId("6a715b8bef456f59d48c6913"),
  
  // ✅ These are the only references we should store
  cityId: ObjectId("6a738f1041806196c135c642"),
  neighborhoodId: ObjectId("6a738f1641806196c135c65e"),
  extraLabel: null,
  
  // ✅ Sales point specific data
  googleMapUrl: "https://maps.app.goo.gl/vHe8gLJB6ZAN81YQ6",
  vip: true,
  lat: 21.4535618,
  lng: 39.9414698,
  socialLinks: {...},
  createdAt: ISODate("2026-07-07T23:36:51.879Z"),
  updatedAt: ISODate("2026-07-07T23:36:51.879Z")
}
```

### How Display Name is Shown (Current Code):
```typescript
// The application does this at runtime:
1. Look up cityId in cities collection
   → { name: "مكة المكرمة", type: "مدينة" }

2. Look up neighborhoodId in neighborhoods collection
   → { name: "الخضراء" }

3. Compute display name:
   composeDisplayName("مكة المكرمة", "مدينة", "الخضراء", null)
   → "نقطة بيع مدينة مكة المكرمة حي الخضراء"

4. Return to UI as `displayName` field
```

---

## Target State (After Cleanup) - ✅ CORRECT

### Database Document:
```javascript
{
  _id: ObjectId("6a4d8d9367cc1a5aff582a93"),
  legacyId: "501608213",
  
  // ✅ Only store references, not computed values
  cityId: ObjectId("6a738f1041806196c135c642"),
  neighborhoodId: ObjectId("6a738f1641806196c135c65e"),
  extraLabel: null,  // nullable - for non-neighborhood locations
  
  // ✅ Sales point specific data
  googleMapUrl: "https://maps.app.goo.gl/vHe8gLJB6ZAN81YQ6",
  vip: true,
  lat: 21.4535618,
  lng: 39.9414698,
  socialLinks: {...},
  createdAt: ISODate("2026-07-07T23:36:51.879Z"),
  updatedAt: ISODate("2026-07-07T23:36:51.879Z")
}
```

### How Display Name is Shown (Same Process):
```typescript
// The application still does the same thing:
1. Look up cityId → { name: "مكة المكرمة", type: "مدينة" }
2. Look up neighborhoodId → { name: "الخضراء" }
3. Compute: composeDisplayName("مكة المكرمة", "مدينة", "الخضراء", null)
   → "نقطة بيع مدينة مكة المكرمة حي الخضراء"
4. Return to UI as `displayName`
```

**The difference:** Legacy fields are gone from storage, but the computed result is identical.

---

## What the API Returns

### Before Cleanup:
```json
{
  "_id": "6a4d8d9367cc1a5aff582a93",
  "cityId": "6a738f1041806196c135c642",
  "cityName": "مكة المكرمة",
  "cityType": "مدينة",
  "neighborhoodId": "6a738f1641806196c135c65e",
  "neighborhoodName": "الخضراء",
  "extraLabel": null,
  "displayName": "نقطة بيع مدينة مكة المكرمة حي الخضراء",
  "vip": true,
  "googleMapUrl": "https://maps.app.goo.gl/vHe8gLJB6ZAN81YQ6",
  "lat": 21.4535618,
  "lng": 39.9414698
}
```

### After Cleanup:
```json
{
  "_id": "6a4d8d9367cc1a5aff582a93",
  "cityId": "6a738f1041806196c135c642",
  "cityName": "مكة المكرمة",
  "cityType": "مدينة",
  "neighborhoodId": "6a738f1641806196c135c65e",
  "neighborhoodName": "الخضراء",
  "extraLabel": null,
  "displayName": "نقطة بيع مدينة مكة المكرمة حي الخضراء",
  "vip": true,
  "googleMapUrl": "https://maps.app.goo.gl/vHe8gLJB6ZAN81YQ6",
  "lat": 21.4535618,
  "lng": 39.9414698
}
```

**Identical response!** The API always computes `displayName` dynamically, regardless of what's in the database.

---

## Special Cases

### Case 1: City-Only Sales Point (No Neighborhood)

**Database:**
```javascript
{
  _id: ObjectId("..."),
  cityId: ObjectId("..."),           // → "الباحة"
  neighborhoodId: null,              // ✅ No neighborhood
  extraLabel: null,
  // ...
}
```

**Computed Name:**
```
composeDisplayName("الباحة", "مدينة", null, null)
→ "نقطة بيع مدينة الباحة"
```

---

### Case 2: Type Exception (محافظة)

**Database:**
```javascript
{
  _id: ObjectId("..."),
  cityId: ObjectId("..."),           // → City { name: "عفيف", type: "محافظة" }
  neighborhoodId: null,
  extraLabel: null,
  // ...
}
```

**Computed Name:**
```
composeDisplayName("عفيف", "محافظة", null, null)
→ "نقطة بيع محافظة عفيف"
```

---

### Case 3: Type Exception (منطقة)

**Database:**
```javascript
{
  _id: ObjectId("..."),
  cityId: ObjectId("..."),           // → City { name: "الليث", type: "منطقة" }
  neighborhoodId: null,
  extraLabel: null,
  // ...
}
```

**Computed Name:**
```
composeDisplayName("الليث", "منطقة", null, null)
→ "نقطة بيع منطقة الليث"
```

---

### Case 4: extraLabel (Non-Neighborhood Location)

**Database:**
```javascript
{
  _id: ObjectId("..."),
  cityId: ObjectId("..."),           // → "عريعرة"
  neighborhoodId: null,              // ✅ No neighborhood
  extraLabel: "شارع الاصفر",         // ✅ Street name instead
  // ...
}
```

**Computed Name:**
```
composeDisplayName("عريعرة", "مدينة", null, "شارع الاصفر")
→ "نقطة بيع مدينة عريعرة شارع الاصفر"
```

---

## Why This Matters

### ❌ Storing Display Names (Old Way):
- **Data duplication** - same info in multiple places
- **Inconsistency risk** - if City name changes, stored name becomes wrong
- **Hard to update** - need to recompute and save 55+ documents
- **Type information embedded** - can't easily change مدينة → محافظة

### ✅ Computing Display Names (New Way):
- **Single source of truth** - City and Neighborhood collections
- **Always consistent** - if City name changes, all display names update automatically
- **Easy to maintain** - update City once, affects all sales points
- **Flexible type handling** - change City.type, display names update instantly

---

## What "Name" Means in Different Contexts

1. **`sales_points.name`** (database field) - ❌ SHOULD NOT EXIST (legacy, being removed)
2. **`displayName`** (API response field) - ✅ COMPUTED at runtime, never stored
3. **`City.name`** (database field) - ✅ STORED (e.g., "مكة المكرمة")
4. **`Neighborhood.name`** (database field) - ✅ STORED (e.g., "الخضراء")

**Only City.name and Neighborhood.name should be stored.**  
**Everything else is computed from these.**

---

## The Cleanup Task

**What it does:**
- Removes `name`, `location`, `neighborhood`, `districtId` from all `sales_points` documents
- Keeps `cityId`, `neighborhoodId`, `extraLabel` (the references)
- Application continues to compute display names exactly as before
- Users see no difference in the UI

**What it doesn't do:**
- Does NOT remove City.name or Neighborhood.name
- Does NOT change how names are computed
- Does NOT affect the API response structure
- Does NOT break any functionality

**Result:**
- Cleaner database schema
- No data duplication
- Single source of truth for city/neighborhood names
- Easier to maintain going forward

---

## Summary

| Aspect | Before Cleanup | After Cleanup |
|--------|---------------|---------------|
| **Database storage** | name + location + neighborhood stored | Only cityId + neighborhoodId stored |
| **Display name computation** | Same algorithm | Same algorithm |
| **API response** | Has displayName field | Has displayName field |
| **UI rendering** | Shows computed name | Shows computed name |
| **User experience** | No change | No change |
| **Data consistency** | Risk of inconsistency | Single source of truth |
| **Maintainability** | Hard to update | Easy to update |

**Bottom line:** The cleanup removes duplication without changing functionality.
