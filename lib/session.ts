import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  isAdmin: boolean
}

export interface SessionOptions {
  password: string
  cookieName: string
  cookieOptions: {
    secure: boolean
    httpOnly: boolean
    sameSite: 'lax' | 'strict' | 'none'
    path: string
    maxAge: number
  }
}

export const defaultSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  cookieName: 'special-car-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), defaultSessionOptions)
  return session
}

export async function setSession(sessionData: SessionData) {
  const session = await getSession()
  session.isAdmin = sessionData.isAdmin
  await session.save()
}

export async function destroySession() {
  const session = await getSession()
  session.destroy()
}
