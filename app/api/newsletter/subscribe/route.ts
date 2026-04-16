import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

import { prisma } from '@/lib/db'
import { sendEmail, getNewsletterConfirmationEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/utils'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = subscribeSchema.parse(body)

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing) {
      if (existing.isConfirmed && !existing.unsubscribedAt) {
        return NextResponse.json(
          { message: 'You are already subscribed to our newsletter.' },
          { status: 200 }
        )
      }

      if (!existing.isConfirmed && existing.confirmToken) {
        // Resend confirmation email
        const confirmUrl = absoluteUrl(
          `/api/newsletter/confirm?token=${existing.confirmToken}`
        )
        const emailContent = getNewsletterConfirmationEmail(confirmUrl)
        await sendEmail({
          to: email,
          ...emailContent,
        })

        return NextResponse.json(
          { message: 'Confirmation email resent. Please check your inbox.' },
          { status: 200 }
        )
      }

      // Resubscribe if previously unsubscribed
      const confirmToken = crypto.randomBytes(32).toString('hex')
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          isConfirmed: false,
          confirmToken,
          unsubscribeToken: crypto.randomBytes(32).toString('hex'),
          unsubscribedAt: null,
        },
      })

      const confirmUrl = absoluteUrl(
        `/api/newsletter/confirm?token=${confirmToken}`
      )
      const emailContent = getNewsletterConfirmationEmail(confirmUrl)
      await sendEmail({
        to: email,
        ...emailContent,
      })

      return NextResponse.json(
        { message: 'Please check your email to confirm your subscription.' },
        { status: 200 }
      )
    }

    // Create new subscriber
    const confirmToken = crypto.randomBytes(32).toString('hex')
    const unsubscribeToken = crypto.randomBytes(32).toString('hex')

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        isConfirmed: false,
        confirmToken,
        unsubscribeToken,
      },
    })

    // Send confirmation email
    const confirmUrl = absoluteUrl(
      `/api/newsletter/confirm?token=${confirmToken}`
    )
    const emailContent = getNewsletterConfirmationEmail(confirmUrl)
    await sendEmail({
      to: email,
      ...emailContent,
    })

    return NextResponse.json(
      { message: 'Please check your email to confirm your subscription.' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
