import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id }, include: { sections: { orderBy: { order: 'asc' } } } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ page })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await req.json()
  const existing = await prisma.page.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const page = await prisma.page.update({
    where: { id },
    data: {
      ...body,
      publishedAt: body.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  })
  return NextResponse.json({ page })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  await prisma.page.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
