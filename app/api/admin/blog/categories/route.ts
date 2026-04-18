import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const categories = await prisma.blogCategory.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ categories })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const category = await prisma.blogCategory.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || null,
      },
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
