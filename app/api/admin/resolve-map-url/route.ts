import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Live outbound request → never statically rendered or cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SSRF guard: only Google's short-link hosts may be resolved (primary defense).
 * Full Google Maps URLs are parsed client-side and are never sent here.
 */
const ALLOWED_HOSTS = new Set(['goo.gl', 'maps.app.goo.gl'])
const MAX_REDIRECTS = 5
const TIMEOUT_MS = 5000

/**
 * Resolve a Google Maps short link to its final URL through a bounded,
 * manually-followed redirect chain. Admin-gated. The response body is never
 * read — only the final URL is returned (FR-011).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const raw = typeof body?.url === 'string' ? body.url.trim() : ''
    if (!raw) return NextResponse.json({ error: 'invalid_host' }, { status: 400 })

    let current: URL
    try {
      current = new URL(raw)
    } catch {
      return NextResponse.json({ error: 'invalid_host' }, { status: 400 })
    }
    if (!ALLOWED_HOSTS.has(current.hostname.toLowerCase())) {
      return NextResponse.json({ error: 'invalid_host' }, { status: 400 })
    }

    let hops = 0
    for (;;) {
      let res: Response
      try {
        res = await fetch(current, {
          redirect: 'manual',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
      } catch (err) {
        if (isTimeoutError(err)) {
          return NextResponse.json({ error: 'timeout' }, { status: 504 })
        }
        return NextResponse.json({ error: 'network_error' }, { status: 502 })
      }

      const status = res.status
      if (status >= 300 && status < 400) {
        const location = res.headers.get('location')
        if (!location) return NextResponse.json({ error: 'network_error' }, { status: 502 })
        try {
          current = new URL(location, current)
        } catch {
          return NextResponse.json({ error: 'network_error' }, { status: 502 })
        }
        hops += 1
        if (hops > MAX_REDIRECTS) {
          return NextResponse.json({ error: 'too_many_redirects' }, { status: 504 })
        }
        continue
      }
      break
    }

    // Success: final URL only — coordinates live in the URL, never the body (FR-011).
    return NextResponse.json({ resolvedUrl: current.toString() })
  } catch {
    return NextResponse.json({ error: 'network_error' }, { status: 502 })
  }
}

function isTimeoutError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name?: string }).name
    return name === 'AbortError' || name === 'TimeoutError'
  }
  return false
}