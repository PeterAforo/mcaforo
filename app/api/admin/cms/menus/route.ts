import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const menus = await prisma.menu.findMany({
    include: {
      items: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
        include: { children: { orderBy: { order: 'asc' } } },
      },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ menus })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const menu = await prisma.menu.create({
      data: {
        name: body.name,
        location: body.location,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ menu }, { status: 201 })
  } catch (error) {
    console.error('Create menu error:', error)
    return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
  }
}
