import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'PM']

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  productType: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional().nullable(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
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

    const { planId } = await params
    const body = await request.json()
    const data = updatePlanSchema.parse(body)

    const plan = await prisma.plan.update({
      where: { id: planId },
      data,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { planId } = await params

    // Check for active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId,
        status: 'ACTIVE',
      },
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { error: `Cannot delete plan with ${activeSubscriptions} active subscription(s)` },
        { status: 400 }
      )
    }

    await prisma.plan.delete({
      where: { id: planId },
    })

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
