import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const recurring = await prisma.recurringInvoice.findUnique({
    where: { id },
    include: { company: true, invoices: { orderBy: { createdAt: 'desc' } } },
  })
  if (!recurring) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ recurring })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = { ...body }
  if (body.startDate) data.startDate = new Date(body.startDate)
  if (body.endDate) data.endDate = new Date(body.endDate)
  if (body.nextIssueDate) data.nextIssueDate = new Date(body.nextIssueDate)
  const recurring = await prisma.recurringInvoice.update({ where: { id }, data })
  return NextResponse.json({ recurring })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  await prisma.recurringInvoice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
