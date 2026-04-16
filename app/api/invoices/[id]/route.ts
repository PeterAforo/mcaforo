import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: z.string().transform((val) => new Date(val)).optional(),
  notes: z.string().optional(),
})

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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            companyUsers: {
              where: { userId: session.id },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check access
    const isAdmin = session.roles.includes('ADMIN') || session.roles.includes('FINANCE')
    const hasCompanyAccess = invoice.company.companyUsers.length > 0

    if (!isAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.roles.includes('ADMIN') || session.roles.includes('FINANCE')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateInvoiceSchema.parse(body)

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
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
    })

    // Send email if status changed to SENT
    if (data.status === 'SENT') {
      const users = invoice.company.companyUsers.map((cu) => cu.user)
      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `New Invoice ${invoice.invoiceNumber} - McAforo`,
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0f172a;">New Invoice</h1>
                <p>Hi ${user.firstName},</p>
                <p>A new invoice has been generated for your account:</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                  <p><strong>Amount:</strong> ${invoice.currency} ${Number(invoice.total).toFixed(2)}</p>
                  <p><strong>Due Date:</strong> ${invoice.dueDate?.toLocaleDateString() || 'N/A'}</p>
                </div>
                <p>Please log in to your portal to view and pay this invoice.</p>
              </body>
            </html>
          `,
        })
      }
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Update invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}
