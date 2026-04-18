import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const recurring = await prisma.recurringInvoice.findMany({
    include: {
      company: { select: { id: true, name: true } },
      _count: { select: { invoices: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ recurring })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const startDate = new Date(body.startDate)
    const recurring = await prisma.recurringInvoice.create({
      data: {
        companyId: body.companyId,
        name: body.name,
        description: body.description || null,
        cycle: body.cycle,
        startDate,
        endDate: body.endDate ? new Date(body.endDate) : null,
        nextIssueDate: body.nextIssueDate ? new Date(body.nextIssueDate) : startDate,
        dueDays: body.dueDays ?? 14,
        isActive: body.isActive ?? true,
        subtotal: body.subtotal,
        tax: body.tax ?? 0,
        discount: body.discount ?? 0,
        total: body.total,
        currency: body.currency || 'GHS',
        lateFeePercent: body.lateFeePercent ?? null,
        templateJson: body.templateJson || null,
      },
    })
    return NextResponse.json({ recurring }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create recurring invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
