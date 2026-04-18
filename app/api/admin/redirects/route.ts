import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Schema = z.object({
  source: z.string().min(1).startsWith('/'),
  destination: z.string().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  isActive: z.boolean().default(true),
})

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'redirect.manage', 'Redirect')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma as any).redirect.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'redirect.manage', 'Redirect')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = await (prisma as any).redirect.create({ data: parsed.data })
    revalidateTag('redirects')
    await recordAudit(
      auditContextFromSession(auth.session, { headers: req.headers }),
      { action: 'create', entityType: 'Redirect', entityId: item.id, newValues: parsed.data }
    )
    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Source already exists' }, { status: 409 })
    }
    console.error('[redirect]', err)
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}
