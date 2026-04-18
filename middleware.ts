import { NextRequest, NextResponse } from 'next/server'

/**
 * Sprint 9: redirect resolution middleware.
 *
 * This runs on every request. To avoid hitting Prisma from the edge we keep
 * it minimal: the redirect table is queried via a Node-runtime fetch to our
 * own `/api/internal/redirects-map` endpoint, which is cached with
 * `revalidateTag('redirects')`.
 *
 * In production, a Redis-backed map would be better — this is a safe
 * default that performs well under normal traffic.
 */

async function lookupRedirect(origin: string, source: string): Promise<{ destination: string; statusCode: number } | null> {
  try {
    const res = await fetch(`${origin}/api/internal/redirects-map`, {
      next: { tags: ['redirects'], revalidate: 3600 },
    })
    if (!res.ok) return null
    const map = (await res.json()) as Record<string, { destination: string; statusCode: number }>
    return map[source] ?? null
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  // Skip internal & static
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  const origin = req.nextUrl.origin
  const redirect = await lookupRedirect(origin, pathname)
  if (redirect) {
    const url = new URL(redirect.destination, origin)
    if (search) url.search = search
    return NextResponse.redirect(url, { status: redirect.statusCode })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|uploads|favicon.ico).*)'],
}
