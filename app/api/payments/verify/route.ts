import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { verifyTransaction } from '@/lib/flutterwave'
import { sendEmail } from '@/lib/email'

const verifySchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  txRef: z.string().min(1, 'Transaction reference is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, txRef } = verifySchema.parse(body)

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: { txRef },
      include: {
        invoice: {
          include: {
            company: {
              include: {
                companyUsers: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status === 'SUCCESSFUL') {
      return NextResponse.json({
        status: 'success',
        message: 'Payment already verified',
      })
    }

    // Verify with Flutterwave
    const verification = await verifyTransaction(transactionId)

    if (verification.status === 'successful') {
      // Update transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESSFUL',
          flutterwaveRef: transactionId,
        },
      })

      // Update invoice
      await prisma.invoice.update({
        where: { id: transaction.invoiceId },
        data: {
          status: 'PAID',
        },
      })

      // Send confirmation email to all company users
      const users = transaction.invoice.company.companyUsers.map((cu) => cu.user)
      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `Payment Received - Invoice ${transaction.invoice.invoiceNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0f172a;">Payment Confirmed</h1>
                <p>Hi ${user.firstName},</p>
                <p>We've received your payment of <strong>${transaction.currency} ${Number(transaction.amount).toFixed(2)}</strong> for Invoice ${transaction.invoice.invoiceNumber}.</p>
                <p>Thank you for your business!</p>
                <p>Best regards,<br>The McAforo Team</p>
              </body>
            </html>
          `,
        })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified successfully',
      })
    } else {
      // Update transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
        },
      })

      return NextResponse.json({
        status: 'failed',
        message: 'Payment verification failed',
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
