import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Create = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80),
  location: z.enum(['header', 'footer', 'mobile']).default('header'),
})

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'menu.read', 'Menu')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma as any).menu.findMany({
    orderBy: { createdAt: 'asc' },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'menu.update', 'Menu')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Create.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (prisma as any).menu.create({ data: parsed.data })
  revalidateTag('menus')
  await recordAudit(auditContextFromSession(auth.session, { headers: req.headers }), {
    action: 'create', entityType: 'Menu', entityId: item.id, newValues: parsed.data,
  })
  return NextResponse.json({ item }, { status: 201 })
}
