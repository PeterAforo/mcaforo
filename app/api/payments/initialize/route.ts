import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { initializePayment, generateTxRef } from '@/lib/flutterwave'
import { absoluteUrl } from '@/lib/utils'

const initializeSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId } = initializeSchema.parse(body)

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: {
          include: {
            companyUsers: {
              where: { userId: session.id },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Verify user has access to this invoice
    if (invoice.company.companyUsers.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice already paid' },
        { status: 400 }
      )
    }

    // Generate transaction reference
    const txRef = generateTxRef('INV')

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        invoiceId: invoice.id,
        amount: Number(invoice.total),
        currency: invoice.currency,
        txRef,
        status: 'PENDING',
      },
    })

    // Initialize Flutterwave payment
    const paymentLink = await initializePayment({
      amount: Number(invoice.total),
      currency: invoice.currency,
      email: session.email,
      name: `${session.firstName} ${session.lastName}`,
      txRef,
      redirectUrl: absoluteUrl(`/portal/invoices/${invoice.id}/callback`),
      meta: {
        invoiceId: invoice.id,
        userId: session.id,
      },
      customizations: {
        title: 'McAforo Invoice Payment',
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
      },
    })

    return NextResponse.json({ paymentLink })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
