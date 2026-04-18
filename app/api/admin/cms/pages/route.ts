import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ pages })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const page = await prisma.page.create({
      data: {
        slug: body.slug,
        title: body.title,
        content: body.content || '',
        excerpt: body.excerpt || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        featuredImage: body.featuredImage || null,
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
      },
    })
    return NextResponse.json({ page }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
