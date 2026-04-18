import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { generateApiKey } from '@/lib/cms/api-keys'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Create = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(z.string()).default(['content.read']),
  rateLimit: z.number().int().min(1).max(10000).default(60),
  expiresAt: z.string().datetime().optional(),
})

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'settings.update', 'ApiKey')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma as any).apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, prefix: true, scopes: true, rateLimit: true,
      expiresAt: true, revokedAt: true, lastUsedAt: true, createdAt: true,
    },
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'settings.update', 'ApiKey')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Create.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }
  const { plain, hash, prefix } = generateApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const key = await (prisma as any).apiKey.create({
    data: {
      name: parsed.data.name,
      hash,
      prefix,
      scopes: parsed.data.scopes,
      rateLimit: parsed.data.rateLimit,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: auth.session.user.id,
    },
  })
  await recordAudit(auditContextFromSession(auth.session, { headers: req.headers }), {
    action: 'create', entityType: 'ApiKey', entityId: key.id, newValues: { name: parsed.data.name, scopes: parsed.data.scopes },
  })
  // Return the plaintext key ONCE. The client must store it — we only keep the hash.
  return NextResponse.json({ key: { ...key, plain } }, { status: 201 })
}
