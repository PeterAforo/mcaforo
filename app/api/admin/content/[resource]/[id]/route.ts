import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { getResource } from '@/lib/cms/resources'
import { recordAudit, auditContextFromSession, diffValues } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ resource: string; id: string }> }

function delegate(model: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model]
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource, id } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.read', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const item = await delegate(cfg.model).findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource, id } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.update', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = cfg.updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const del = delegate(cfg.model)
  const before = await del.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const item = await del.update({
      where: { id },
      data: parsed.data as object,
    })
    revalidateTag(cfg.cacheTag)
    await recordAudit(
      auditContextFromSession(auth.session, { headers: req.headers }),
      {
        action: 'update',
        entityType: cfg.resource,
        entityId: id,
        oldValues: diffValues(
          before as Record<string, unknown>,
          parsed.data as Record<string, unknown>
        ),
        newValues: parsed.data as object,
      }
    )
    return NextResponse.json({ item })
  } catch (err) {
    console.error(`[content:${resource}] update`, err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource, id } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.delete', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const del = delegate(cfg.model)
  const before = await del.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await del.delete({ where: { id } })
  revalidateTag(cfg.cacheTag)
  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    {
      action: 'delete',
      entityType: cfg.resource,
      entityId: id,
      oldValues: before as object,
    }
  )
  return NextResponse.json({ ok: true })
}
