import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const provider = await prisma.integrationProvider.findUnique({ where: { id } })
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ provider })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  if (body.name !== undefined) allowed.name = body.name
  if (body.description !== undefined) allowed.description = body.description
  if (body.config !== undefined) allowed.config = body.config
  if (body.testMode !== undefined) allowed.testMode = body.testMode
  const provider = await prisma.integrationProvider.update({ where: { id }, data: allowed })
  return NextResponse.json({ provider })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  await prisma.integrationProvider.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
