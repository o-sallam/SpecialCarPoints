import { ObjectId } from 'mongodb'

export interface SalesPoint {
  _id: ObjectId
  legacyId: string | null
  cityId: ObjectId
  /** nullable — city-only points (e.g. "نقطة بيع مدينة الباحة") have no neighborhood */
  neighborhoodId: ObjectId | null
  /** nullable — non-neighborhood place text (streets / compound tokens), kept
   *  out of the neighborhoods collection on purpose */
  extraLabel: string | null
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
  // Legacy free-text fields, kept temporarily on the documents (rename to
  // _legacy* is deferred per Task 6 until the new code is deployed). Going
  // forward, new code MUST NOT read these — compose the display name from
  // city + neighborhood via lib/points.composeDisplayName.
  name?: string
  location?: string
  neighborhood?: string | null
}

export interface City {
  _id: ObjectId
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Neighborhood {
  _id: ObjectId
  name: string
  cityId: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  _id: 'main'
  storeName: string
  storeUrl: string
  storeDescription: string
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
