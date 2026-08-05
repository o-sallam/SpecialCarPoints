# Quick Instruction: Always Use "مدينة" Prefix

**Task:** Change display names to always show "مدينة", not "محافظة" or "منطقة"  
**Risk:** LOW (cosmetic change only, no database changes)  
**Time:** 5 minutes

---

## What Needs to Change

### Current Behavior (Wrong):
- الليث → "نقطة بيع **منطقة** الليث"
- عفيف → "نقطة بيع **محافظة** عفيف"
- مكة → "نقطة بيع مدينة مكة المكرمة حي الخضراء"

### Desired Behavior (Correct):
- الليث → "نقطة بيع **مدينة** الليث" ✅
- عفيف → "نقطة بيع **مدينة** عفيف" ✅
- مكة → "نقطة بيع مدينة مكة المكرمة حي الخضراء" ✅

**All cities should use "مدينة" prefix, always.**

---

## How to Fix (Recommended: Option 1)

### Change 1 line in `lib/points.ts`:

**Find this:**
```typescript
let s = 'نقطة بيع ' + cityType + ' ' + cityName
```

**Replace with:**
```typescript
let s = 'نقطة بيع مدينة ' + cityName  // Always use "مدينة"
```

**Also update the JSDoc comment above the function:**
```typescript
/**
 * Compose the human-readable sales-point name. UI-only — never persisted.
 * Always prefixes city with "مدينة" regardless of stored city type.
 *   "نقطة بيع مدينة " + city + (" حي " + neighborhood | " " + extraLabel | "")
 */
```

That's it! No other changes needed.

---

## Commit and Push

```bash
git add lib/points.ts
git commit -m "fix: always use مدينة prefix in display names"
git push origin main
```

---

## Verify After Deploy

```bash
# Should show "مدينة" for all cities
curl https://special-car-points.vercel.app/api/sales-points | jq '.[] | select(.cityName | contains("الليث") or contains("عفيف")) | .displayName'
```

Expected:
```
"نقطة بيع مدينة الليث"
"نقطة بيع مدينة عفيف"
```

---

## Full Details

See: **`plans/task-always-use-madina-prefix.md`** for complete explanation and alternative approaches.

---

## Quick Summary

- **1 file to change:** `lib/points.ts`
- **1 line to change:** The `let s = ...` line
- **No database changes**
- **No migration needed**
- **Low risk**
