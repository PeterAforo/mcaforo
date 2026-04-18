import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getResource } from '@/lib/cms/resources'
import { requireApiKey } from '@/lib/cms/api-keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ resource: string }> }

/**
 * Sprint 10: Public read-only API.
 *
 * GET /api/v1/content/:resource?page=&limit=
 *   - Requires API key with scope `content.read` (or `*`)
 *   - Returns only PUBLISHED + isActive items
 *   - Strips internal fields
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireApiKey(req, 'content.read')
  if (!auth.ok) return auth.response
  const { resource } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  }
  const url = req.nextUrl
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[cfg.model]
  const where: Record<string, unknown> = {}
  // Only published + active
  try {
    where.status = 'PUBLISHED'
  } catch {
    /* some models don't have status */
  }
  where.isActive = true
  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: cfg.orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    delegate.count({ where }),
  ])
  return NextResponse.json(
    {
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    },
    {
      headers: {
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
