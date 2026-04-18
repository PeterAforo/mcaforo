import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Tree = z.array(
  z.object({
    id: z.string().optional(),
    label: z.string().min(1),
    url: z.string().min(1),
    target: z.enum(['_self', '_blank']).default('_self'),
    order: z.number().int().default(0),
    parentId: z.string().nullable().optional(),
  })
)

type Ctx = { params: Promise<{ id: string }> }

/**
 * PUT replaces the whole menu tree atomically. The frontend sends a flat
 * list with `parentId` + `order` — parent referential integrity is enforced
 * by first creating parents then children.
 */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'menu.update', 'Menu')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id: menuId } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = Tree.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  await db.$transaction(async (tx: any) => {
    await tx.menuItem.deleteMany({ where: { menuId } })
    // two-pass: roots first, then children (remap temp ids -> real ids)
    const idMap = new Map<string, string>()
    const roots = parsed.data.filter((n) => !n.parentId)
    for (const r of roots) {
      const created = await tx.menuItem.create({
        data: { menuId, label: r.label, url: r.url, target: r.target, order: r.order },
      })
      if (r.id) idMap.set(r.id, created.id)
    }
    const children = parsed.data.filter((n) => n.parentId)
    for (const c of children) {
      const realParent = c.parentId ? idMap.get(c.parentId) ?? c.parentId : null
      await tx.menuItem.create({
        data: {
          menuId,
          label: c.label,
          url: c.url,
          target: c.target,
          order: c.order,
          parentId: realParent,
        },
      })
    }
  })
  revalidateTag('menus', 'default')
  await recordAudit(auditContextFromSession(auth.session, { headers: req.headers }), {
    action: 'update', entityType: 'Menu', entityId: menuId, newValues: { itemCount: parsed.data.length },
  })
  return NextResponse.json({ ok: true })
}
