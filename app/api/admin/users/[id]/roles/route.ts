import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN']

const updateRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can modify roles
    const isAdmin = session.roles?.includes('ADMIN')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { roleIds } = updateRolesSchema.parse(body)

    // Delete existing roles
    await prisma.userRole.deleteMany({
      where: { userId: id },
    })

    // Add new roles
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: id,
          roleId,
        })),
      })
    }

    // Fetch updated user roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: true },
    })

    return NextResponse.json({ userRoles })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Update user roles error:', error)
    return NextResponse.json(
      { error: 'Failed to update user roles' },
      { status: 500 }
    )
  }
}
