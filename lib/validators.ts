import { z } from 'zod'
import { ObjectId } from 'mongodb'

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
  lat: z.number().nullable(),
  lng: z.number().nullable(),
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

export const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeUrl: z.string().url('Invalid store URL'),
  storeDescription: z.string().min(1, 'Description is required'),
})
