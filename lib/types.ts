import { ObjectId } from 'mongodb'

export interface SalesPoint {
  _id: ObjectId
  legacyId: string | null
  districtId: ObjectId
  name: string
  location: string
  neighborhood: string | null
  googleMapUrl: string
  vip: boolean
  lat: number | null
  lng: number | null
  socialLinks: {
    x: string
    facebook: string
    whatsapp: string
    linkedin: string
    email: string
    messenger: string
    snapchat: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  _id: 'main'
  storeName: string
  storeUrl: string
  storeDescription: string
}

export interface District {
  _id: ObjectId
  /** Arabic label, e.g. 'منطقة الرياض' */
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface DataJsonItem {
  url: string
  name: string
  description?: string
  location: string | null
  neighborhood: string | null
  type?: string
  id: string
  vip: boolean
  latitude?: number | null
  longitude?: number | null
}
