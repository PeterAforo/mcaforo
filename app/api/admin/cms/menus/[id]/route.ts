import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const menu = await prisma.menu.findUnique({
    where: { id },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
        include: { children: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ menu })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await req.json()
  const menu = await prisma.menu.update({ where: { id }, data: body })
  return NextResponse.json({ menu })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  await prisma.menu.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
