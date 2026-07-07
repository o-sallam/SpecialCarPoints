import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { setSession } from '@/lib/session'
import { loginSchema } from '@/lib/validators'
import { z } from 'zod'

// Pre-compute hash at import time to avoid dotenv $ expansion issues
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
  || (process.env.ADMIN_PASSWORD ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10) : '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const adminUsername = process.env.ADMIN_USERNAME

    if (!adminUsername || !adminPasswordHash) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, adminPasswordHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    await setSession({ isAdmin: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
