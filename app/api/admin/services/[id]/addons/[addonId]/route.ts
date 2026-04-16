import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'PM']

const updateAddOnSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAdminRole = session.roles?.some((role: string) => ADMIN_ROLES.includes(role))
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { addonId } = await params
    const body = await request.json()
    const data = updateAddOnSchema.parse(body)

    const addOn = await prisma.addOn.update({
      where: { id: addonId },
      data,
    })

    return NextResponse.json({ addOn })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Update add-on error:', error)
    return NextResponse.json({ error: 'Failed to update add-on' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { addonId } = await params

    await prisma.addOn.delete({
      where: { id: addonId },
    })

    return NextResponse.json({ message: 'Add-on deleted successfully' })
  } catch (error) {
    console.error('Delete add-on error:', error)
    return NextResponse.json({ error: 'Failed to delete add-on' }, { status: 500 })
  }
}
