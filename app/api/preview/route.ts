import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.CMS_PREVIEW_SECRET || process.env.AUTH_SECRET || 'change-me'
)

/**
 * Sprint 8: Preview mode.
 *
 * POST /api/preview  (admin, signs a preview token for a draft)
 *   body: { entityType, entityId, redirectTo, ttl? }
 *
 * GET /api/preview?token=...  — sets the `cms-preview` cookie, redirects
 * DELETE /api/preview — clears the cookie
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { requireAdmin } = await import('@/lib/admin-auth')
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const body = (await req.json().catch(() => ({}))) as {
    entityType?: string
    entityId?: string
    redirectTo?: string
    ttl?: number
  }
  if (!body.entityType || !body.entityId || !body.redirectTo) {
    return NextResponse.json(
      { error: 'entityType, entityId, redirectTo required' },
      { status: 400 }
    )
  }
  const token = await new SignJWT({
    t: body.entityType,
    i: body.entityId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(body.ttl && body.ttl > 60 ? `${body.ttl}s` : '5m')
    .sign(SECRET)
  const url = new URL(req.url)
  return NextResponse.json({
    token,
    url: `${url.origin}/api/preview?token=${token}&redirect=${encodeURIComponent(body.redirectTo)}`,
  })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const redirect = req.nextUrl.searchParams.get('redirect') || '/'
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  try {
    await jwtVerify(token, SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const cookieStore = await cookies()
  cookieStore.set('cms-preview', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return NextResponse.redirect(new URL(redirect, req.url))
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('cms-preview')
  return NextResponse.json({ ok: true })
}

/** Helper used by public renderers to detect preview mode. */
export async function getPreviewContext() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cms-preview')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { entityType: payload.t as string, entityId: payload.i as string }
  } catch {
    return null
  }
}
