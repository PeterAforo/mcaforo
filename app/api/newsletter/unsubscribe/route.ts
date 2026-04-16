import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { sendEmail, getUnsubscribeConfirmationEmail } from '@/lib/email'
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
      where: { unsubscribeToken: token },
    })

    if (!subscriber) {
      return NextResponse.redirect(
        absoluteUrl('/newsletter/error?reason=invalid-token')
      )
    }

    if (subscriber.unsubscribedAt) {
      return NextResponse.redirect(
        absoluteUrl('/newsletter/already-unsubscribed')
      )
    }

    // Unsubscribe
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        unsubscribedAt: new Date(),
      },
    })

    // Send confirmation email
    const emailContent = getUnsubscribeConfirmationEmail()
    await sendEmail({
      to: subscriber.email,
      ...emailContent,
    })

    return NextResponse.redirect(absoluteUrl('/newsletter/unsubscribed'))
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.redirect(
      absoluteUrl('/newsletter/error?reason=server-error')
    )
  }
}
