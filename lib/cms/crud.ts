import { NextRequest, NextResponse } from 'next/server'
import { z, ZodTypeAny } from 'zod'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can, type Action, type Resource } from '@/lib/auth/permissions'
import { recordAudit, auditContextFromSession, diffValues } from '@/lib/cms/audit'

type PrismaDelegate = {
  findMany: (args?: unknown) => Promise<unknown[]>
  findUnique: (args: unknown) => Promise<unknown>
  count: (args?: unknown) => Promise<number>
  create: (args: unknown) => Promise<unknown>
  update: (args: unknown) => Promise<unknown>
  delete: (args: unknown) => Promise<unknown>
}

export interface CrudConfig<TCreate, TUpdate> {
  /** Prisma model name, lowercase (e.g. 'marketingService') */
  model: keyof typeof prisma & string
  /** Permission resource (e.g. 'MarketingService') */
  resource: Resource
  /** Revalidate-tag name used on write */
  cacheTag: string
  /** Include clause for relation hydration */
  include?: Record<string, unknown>
  /** Default orderBy */
  orderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[]
  /** Searchable fields (inserted into OR contains query on ?search=) */
  searchFields?: string[]
  /** Schemas */
  createSchema: z.ZodType<TCreate>
  updateSchema: z.ZodType<TUpdate>
}

function getDelegate(model: string): PrismaDelegate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[model]
  if (!delegate) {
    throw new Error(`Unknown prisma model: ${model}`)
  }
  return delegate as PrismaDelegate
}

/**
 * Factory returning `{ GET, POST }` for a resource list/collection route.
 */
export function createCollectionHandlers<TCreate, TUpdate>(
  cfg: CrudConfig<TCreate, TUpdate>,
  actions: { read: Action; create: Action }
) {
  async function GET(req: NextRequest) {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    if (!can(auth.session, actions.read, cfg.resource)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const url = req.nextUrl
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50)))
    const search = url.searchParams.get('search') ?? ''
    const where: Record<string, unknown> = {}
    if (search && cfg.searchFields?.length) {
      where.OR = cfg.searchFields.map((f) => ({
        [f]: { contains: search, mode: 'insensitive' },
      }))
    }
    const delegate = getDelegate(cfg.model)
    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        include: cfg.include,
        orderBy: cfg.orderBy ?? { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      delegate.count({ where }),
    ])
    return NextResponse.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  }

  async function POST(req: NextRequest) {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    if (!can(auth.session, actions.create, cfg.resource)) {
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
      const delegate = getDelegate(cfg.model)
      const item = (await delegate.create({
        data: parsed.data as object,
        include: cfg.include,
      })) as { id: string }
      revalidateTag(cfg.cacheTag)
      await recordAudit(
        auditContextFromSession(auth.session, { headers: req.headers }),
        {
          action: 'create',
          entityType: cfg.resource,
          entityId: item.id,
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
          { error: 'Unique constraint violation (slug or similar already exists)' },
          { status: 409 }
        )
      }
      console.error(`[crud:${cfg.model}] create`, err)
      return NextResponse.json({ error: 'Create failed' }, { status: 500 })
    }
  }

  return { GET, POST }
}

/**
 * Factory returning `{ GET, PATCH, DELETE }` for a single-resource route.
 */
export function createItemHandlers<TCreate, TUpdate>(
  cfg: CrudConfig<TCreate, TUpdate>,
  actions: { read: Action; update: Action; delete: Action }
) {
  type Ctx = { params: Promise<{ id: string }> }

  async function GET(_req: NextRequest, ctx: Ctx) {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    if (!can(auth.session, actions.read, cfg.resource)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await ctx.params
    const delegate = getDelegate(cfg.model)
    const item = await delegate.findUnique({
      where: { id },
      include: cfg.include,
    })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item })
  }

  async function PATCH(req: NextRequest, ctx: Ctx) {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    if (!can(auth.session, actions.update, cfg.resource)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await ctx.params
    const body = await req.json().catch(() => null)
    const parsed = cfg.updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const delegate = getDelegate(cfg.model)
    const before = await delegate.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    try {
      const item = (await delegate.update({
        where: { id },
        data: parsed.data as object,
        include: cfg.include,
      })) as { id: string }
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
      console.error(`[crud:${cfg.model}] update`, err)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
  }

  async function DELETE(req: NextRequest, ctx: Ctx) {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    if (!can(auth.session, actions.delete, cfg.resource)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await ctx.params
    const delegate = getDelegate(cfg.model)
    const before = await delegate.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await delegate.delete({ where: { id } })
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

  return { GET, PATCH, DELETE }
}

/** Common partial-of-required trick for update schemas. */
export function makePartial<T extends ZodTypeAny>(schema: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (schema as any).partial?.() ?? schema
}
