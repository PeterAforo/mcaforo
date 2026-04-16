import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'PM']

const createPlanSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  priceMin: z.number().min(0, 'Price must be positive'),
  priceMax: z.number().min(0, 'Price must be positive'),
  productType: z.enum(['ONE_TIME', 'RECURRING']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
})

const updatePlanSchema = createPlanSchema.partial()

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
    const data = createPlanSchema.parse(body)

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const plan = await prisma.plan.create({
      data: {
        serviceId,
        name: data.name,
        description: data.description,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        productType: data.productType,
        billingCycle: data.billingCycle,
        features: data.features,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
