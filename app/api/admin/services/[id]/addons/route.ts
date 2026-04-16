import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'PM']

const createAddOnSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be positive'),
  isActive: z.boolean().optional().default(true),
})

export async function POST(
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

    const { id: serviceId } = await params
    const body = await request.json()
    const data = createAddOnSchema.parse(body)

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const addOn = await prisma.addOn.create({
      data: {
        serviceId,
        name: data.name,
        description: data.description,
        price: data.price,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ addOn }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create add-on error:', error)
    return NextResponse.json({ error: 'Failed to create add-on' }, { status: 500 })
  }
}
