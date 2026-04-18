import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const item = await prisma.menuItem.create({
      data: {
        menuId: body.menuId,
        parentId: body.parentId || null,
        label: body.label,
        url: body.url,
        icon: body.icon || null,
        target: body.target || '_self',
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Create menu item error:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
