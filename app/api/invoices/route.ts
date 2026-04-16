import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const createInvoiceSchema = z.object({
  companyId: z.string().min(1),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ),
  dueDate: z.string().transform((val) => new Date(val)),
  notes: z.string().optional(),
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

    // Get invoices for user's companies
    const invoices = await prisma.invoice.findMany({
      where: { companyId: { in: companyIds } },
      include: {
        company: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoices' },
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

    // Check if user is admin or finance
    const isAdmin = session.roles.includes('ADMIN') || session.roles.includes('FINANCE')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const data = createInvoiceSchema.parse(body)

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const taxAmount = 0 // Can be configured
    const totalAmount = subtotal + taxAmount

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const invoiceCount = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1
      : 1
    const invoiceNumber = `INV-${invoiceCount.toString().padStart(5, '0')}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: data.companyId,
        subtotal,
        tax: taxAmount,
        total: totalAmount,
        currency: 'GHS',
        status: 'DRAFT',
        dueDate: data.dueDate,
        notes: data.notes,
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
