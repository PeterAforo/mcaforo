import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { verifyWebhookSignature, verifyTransaction } from '@/lib/flutterwave'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('verif-hash')
    const body = await request.text()

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { event, data } = payload

    if (event === 'charge.completed') {
      const { tx_ref, id: transactionId, status } = data

      // Find the transaction
      const transaction = await prisma.transaction.findFirst({
        where: { txRef: tx_ref },
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
        console.error('Transaction not found for webhook:', tx_ref)
        return NextResponse.json({ status: 'ok' })
      }

      if (transaction.status === 'SUCCESSFUL') {
        return NextResponse.json({ status: 'ok' })
      }

      if (status === 'successful') {
        // Verify with Flutterwave API
        const verification = await verifyTransaction(transactionId.toString())

        if (verification.status === 'successful') {
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'SUCCESSFUL',
              flutterwaveRef: transactionId.toString(),
            },
          })

          // Update invoice
          await prisma.invoice.update({
            where: { id: transaction.invoiceId },
            data: {
              status: 'PAID',
            },
          })

          // Send confirmation emails
          const users = transaction.invoice.company.companyUsers.map(
            (cu) => cu.user
          )
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
                  </body>
                </html>
              `,
            })
          }
        }
      } else {
        // Payment failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
          },
        })
      }
    }

    if (event === 'subscription.cancelled') {
      // Subscription cancellation would need provider ID field in schema
      // For now, log the event
      console.log('Subscription cancelled event received:', data)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'ok' })
  }
}
