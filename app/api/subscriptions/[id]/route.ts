import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { cancelSubscription } from '@/lib/flutterwave'
import { sendEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            service: true,
          },
        },
        company: {
          include: {
            companyUsers: {
              where: { userId: session.id },
            },
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Check access
    if (subscription.company.companyUsers.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
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

    const { id } = await params
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            service: true,
          },
        },
        company: {
          include: {
            companyUsers: {
              where: { userId: session.id },
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Check access
    if (subscription.company.companyUsers.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Subscription already cancelled' },
        { status: 400 }
      )
    }

    // Cancel with Flutterwave if needed
    // Note: providerSubscriptionId would need to be added to schema if needed

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    // Send cancellation email
    const user = subscription.company.companyUsers[0]?.user
    if (user) {
      await sendEmail({
        to: user.email,
        subject: 'Subscription Cancelled - McAforo',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #0f172a;">Subscription Cancelled</h1>
              <p>Hi ${user.firstName},</p>
              <p>Your subscription to <strong>${subscription.plan.service.name} - ${subscription.plan.name}</strong> has been cancelled.</p>
              <p>Your access will continue until ${subscription.currentPeriodEnd.toLocaleDateString()}.</p>
              <p>If you change your mind, you can resubscribe anytime from your portal.</p>
            </body>
          </html>
        `,
      })
    }

    return NextResponse.json({ subscription: updatedSubscription })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
