import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const salesPointSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  neighborhood: z.string().nullable(),
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
