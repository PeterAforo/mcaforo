import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'contact.read', 'ContactSubmission')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const status = req.nextUrl.searchParams.get('status')
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma as any).contactSubmission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ items })
}
