import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { sendEmail, getNewsletterWelcomeEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        absoluteUrl('/newsletter/error?reason=missing-token')
      )
    }

    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { confirmToken: token },
    })

    if (!subscriber) {
      return NextResponse.redirect(
        absoluteUrl('/newsletter/error?reason=invalid-token')
      )
    }

    if (subscriber.isConfirmed) {
      return NextResponse.redirect(absoluteUrl('/newsletter/already-confirmed'))
    }

    // Confirm subscription
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
        confirmToken: null,
      },
    })

    // Send welcome email
    const unsubscribeUrl = absoluteUrl(
      `/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`
    )
    const emailContent = getNewsletterWelcomeEmail(unsubscribeUrl)
    await sendEmail({
      to: subscriber.email,
      ...emailContent,
    })

    return NextResponse.redirect(absoluteUrl('/newsletter/confirmed'))
  } catch (error) {
    console.error('Newsletter confirm error:', error)
    return NextResponse.redirect(
      absoluteUrl('/newsletter/error?reason=server-error')
    )
  }
}
