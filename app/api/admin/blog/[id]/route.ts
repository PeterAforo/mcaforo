import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { category: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await req.json()
  const existing = await prisma.blogPost.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...body,
      publishedAt: body.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  })
  return NextResponse.json({ post })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
