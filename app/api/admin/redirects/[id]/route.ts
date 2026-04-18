import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Patch = z.object({
  source: z.string().startsWith('/').optional(),
  destination: z.string().optional(),
  statusCode: z.union([z.literal(301), z.literal(302)]).optional(),
  isActive: z.boolean().optional(),
}).strict()

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'redirect.manage', 'Redirect')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = Patch.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (prisma as any).redirect.update({
    where: { id },
    data: parsed.data,
  })
  revalidateTag('redirects')
  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    { action: 'update', entityType: 'Redirect', entityId: id, newValues: parsed.data }
  )
  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'redirect.manage', 'Redirect')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).redirect.delete({ where: { id } })
  revalidateTag('redirects')
  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    { action: 'delete', entityType: 'Redirect', entityId: id }
  )
  return NextResponse.json({ ok: true })
}
