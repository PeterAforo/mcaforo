import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { initializePayment, generateTxRef } from '@/lib/flutterwave'
import { absoluteUrl } from '@/lib/utils'

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  companyId: z.string().min(1, 'Company ID is required'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's companies
    const userCompanies = await prisma.companyUser.findMany({
      where: { userId: session.id },
      select: { companyId: true },
    })

    const companyIds = userCompanies.map((uc) => uc.companyId)

    // Get subscriptions for user's companies
    const subscriptions = await prisma.subscription.findMany({
      where: { companyId: { in: companyIds } },
      include: {
        plan: {
          include: {
            service: true,
          },
        },
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Get subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, companyId } = createSubscriptionSchema.parse(body)

    // Verify user has access to company
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId: session.id,
        companyId,
      },
    })

    if (!companyUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { service: true },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check for existing active subscription to same service
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        plan: { serviceId: plan.serviceId },
        status: 'ACTIVE',
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Already subscribed to this service' },
        { status: 400 }
      )
    }

    // Generate transaction reference
    const txRef = generateTxRef('SUB')

    // Create pending subscription
    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculatePeriodEnd(plan.billingCycle || 'MONTHLY'),
      },
    })

    // Initialize payment for first period
    const paymentLink = await initializePayment({
      amount: Number(plan.priceMin),
      currency: 'GHS',
      email: session.email,
      name: `${session.firstName} ${session.lastName}`,
      txRef,
      redirectUrl: absoluteUrl(`/portal/billing/callback?subscriptionId=${subscription.id}`),
      meta: {
        subscriptionId: subscription.id,
        planId: plan.id,
        userId: session.id,
      },
      customizations: {
        title: 'McAforo Subscription',
        description: `${plan.service.name} - ${plan.name} Plan`,
      },
    })

    return NextResponse.json({ subscription, paymentLink })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

function calculatePeriodEnd(billingCycle: string): Date {
  const now = new Date()
  switch (billingCycle) {
    case 'MONTHLY':
      return new Date(now.setMonth(now.getMonth() + 1))
    case 'QUARTERLY':
      return new Date(now.setMonth(now.getMonth() + 3))
    case 'YEARLY':
      return new Date(now.setFullYear(now.getFullYear() + 1))
    default:
      return new Date(now.setMonth(now.getMonth() + 1))
  }
}
