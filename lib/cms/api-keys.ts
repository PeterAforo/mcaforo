import 'server-only'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** Generate a new API key. Returns { plain, hash, prefix }. */
export function generateApiKey() {
  const raw = 'mca_' + crypto.randomBytes(24).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { plain: raw, hash, prefix: raw.slice(0, 10) }
}

export async function verifyApiKey(plain: string) {
  const hash = crypto.createHash('sha256').update(plain).digest('hex')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const key = await (prisma as any).apiKey.findUnique({ where: { hash } })
  if (!key || key.revokedAt) return null
  if (key.expiresAt && key.expiresAt < new Date()) return null
  // touch last-used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(prisma as any).apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => null)
  return key as {
    id: string
    name: string
    scopes: string[]
    rateLimit: number
    companyId: string | null
  }
}

export interface ApiKeyAuth {
  ok: true
  key: { id: string; name: string; scopes: string[]; rateLimit: number }
}

export async function requireApiKey(
  req: NextRequest,
  scope?: string
): Promise<ApiKeyAuth | { ok: false; response: NextResponse }> {
  const header =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    req.headers.get('x-api-key') ||
    ''
  if (!header) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing API key' }, { status: 401 }),
    }
  }
  const key = await verifyApiKey(header)
  if (!key) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
    }
  }
  if (scope && !key.scopes.includes(scope) && !key.scopes.includes('*')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `API key missing scope: ${scope}` },
        { status: 403 }
      ),
    }
  }
  return { ok: true, key }
}
