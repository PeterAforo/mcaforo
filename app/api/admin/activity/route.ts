import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50)))
  const entityType = req.nextUrl.searchParams.get('entityType')
  const entityId = req.nextUrl.searchParams.get('entityId')
  const where: Record<string, unknown> = {}
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma as any).auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  })
  return NextResponse.json({ items })
}
