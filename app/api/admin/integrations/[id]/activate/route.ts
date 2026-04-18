import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// Activating a provider deactivates all other providers in the same category.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const target = await prisma.integrationProvider.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.integrationProvider.updateMany({
      where: { category: target.category, NOT: { id } },
      data: { isActive: false, isDefault: false },
    }),
    prisma.integrationProvider.update({
      where: { id },
      data: { isActive: true, isDefault: true },
    }),
  ])

  const updated = await prisma.integrationProvider.findUnique({ where: { id } })
  return NextResponse.json({ provider: updated })
}
