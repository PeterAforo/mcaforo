import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { absoluteUrl } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const subscriptionId = searchParams.get('subscriptionId')

    if (!token) {
      return NextResponse.redirect(absoluteUrl('/login?error=missing-token'))
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    })

    if (!user) {
      return NextResponse.redirect(absoluteUrl('/login?error=invalid-token'))
    }

    if (user.emailVerified) {
      // If already verified but has subscription, redirect to payment
      if (subscriptionId) {
        return NextResponse.redirect(absoluteUrl(`/login?message=already-verified&subscriptionId=${subscriptionId}`))
      }
      return NextResponse.redirect(absoluteUrl('/login?message=already-verified'))
    }

    // Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        status: 'ACTIVE',
      },
    })

    // If user has a pending subscription, redirect to login with subscription info
    if (subscriptionId) {
      return NextResponse.redirect(absoluteUrl(`/login?message=verified&subscriptionId=${subscriptionId}`))
    }

    return NextResponse.redirect(absoluteUrl('/login?message=verified'))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(absoluteUrl('/login?error=server-error'))
  }
}
