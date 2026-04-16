import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'PM']

const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        plans: {
          orderBy: { priceMin: 'asc' },
        },
        addOns: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'Failed to get service' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const body = await request.json()
    const data = updateServiceSchema.parse(body)

    // Check if slug is being changed and if it already exists
    if (data.slug) {
      const existingService = await prisma.service.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      })

      if (existingService) {
        return NextResponse.json({ error: 'A service with this slug already exists' }, { status: 400 })
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data,
      include: {
        plans: true,
        addOns: true,
      },
    })

    return NextResponse.json({ service })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Update service error:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can delete services
    if (!session.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if service has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        plan: { serviceId: id },
        status: 'ACTIVE',
      },
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { error: `Cannot delete service with ${activeSubscriptions} active subscription(s)` },
        { status: 400 }
      )
    }

    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
