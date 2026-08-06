import { z } from 'zod'
import { ObjectId } from 'mongodb'
import { isFiniteInRange, LAT_RANGE, LNG_RANGE } from '@/lib/coordinates'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const salesPointSchema = z.object({
  cityId: z.string().refine((v) => ObjectId.isValid(v), {
    message: 'Invalid cityId',
  }),
  // nullable + optional: '' coerced to null by the route handler before parse.
  neighborhoodId: z
    .string()
    .nullable()
    .refine((v) => v === null || ObjectId.isValid(v), {
      message: 'Invalid neighborhoodId',
    })
    .optional(),
  extraLabel: z.string().nullable().optional(),
  googleMapUrl: z.string().url('Invalid Google Maps URL'),
  vip: z.boolean(),
  lat: z.number().finite().nullable(),
  lng: z.number().finite().nullable(),
  socialLinks: z.object({
    x: z.string(),
    facebook: z.string(),
    whatsapp: z.string(),
    linkedin: z.string(),
    email: z.string().email().or(z.literal('')),
    messenger: z.string(),
    snapchat: z.string(),
  }),
})
  // both-or-neither + range on the lat/lng pair (spec FR-012/FR-013, SC-004).
  // (null,null) passes; (value,null)/(null,value) and out-of-range reject.
  .superRefine((data, ctx) => {
    const { lat, lng } = data
    if (lat == null && lng == null) return
    if (lat == null || lng == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'latitude and longitude must both be provided, or both be null',
      })
      return
    }
    if (!isFiniteInRange(lat, LAT_RANGE)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: `latitude must be within [${LAT_RANGE[0]}, ${LAT_RANGE[1]}]`,
      })
    }
    if (!isFiniteInRange(lng, LNG_RANGE)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lng'],
        message: `longitude must be within [${LNG_RANGE[0]}, ${LNG_RANGE[1]}]`,
      })
    }
  })

export const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeUrl: z.string().url('Invalid store URL'),
  storeDescription: z.string().min(1, 'Description is required'),
})
