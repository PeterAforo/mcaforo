import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { getResource } from '@/lib/cms/resources'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ resource: string }> }

function delegate(model: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model]
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.read', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const url = req.nextUrl
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50)))
  const search = url.searchParams.get('search') ?? ''
  const where: Record<string, unknown> = {}
  if (search && cfg.searchFields.length) {
    where.OR = cfg.searchFields.map((f) => ({
      [f]: { contains: search, mode: 'insensitive' },
    }))
  }
  const del = delegate(cfg.model)
  const [items, total] = await Promise.all([
    del.findMany({
      where,
      orderBy: cfg.orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    del.count({ where }),
  ])
  return NextResponse.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    config: {
      label: cfg.label,
      labelSingular: cfg.labelSingular,
      primaryField: cfg.primaryField,
      secondaryField: cfg.secondaryField,
    },
  })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.create', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = cfg.createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  try {
    const item = await delegate(cfg.model).create({ data: parsed.data as object })
    revalidateTag(cfg.cacheTag, 'default')
    await recordAudit(
      auditContextFromSession(auth.session, { headers: req.headers }),
      {
        action: 'create',
        entityType: cfg.resource,
        entityId: (item as { id: string }).id,
        newValues: parsed.data as object,
      }
    )
    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Unique constraint violation' },
        { status: 409 }
      )
    }
    console.error(`[content:${resource}] create`, err)
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}
