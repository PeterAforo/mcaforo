import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const posts = await prisma.blogPost.findMany({
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const post = await prisma.blogPost.create({
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt || null,
        content: body.content || '',
        featuredImage: body.featuredImage || null,
        author: body.author || 'McAforo Team',
        categoryId: body.categoryId || null,
        tags: body.tags || [],
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
      },
    })
    return NextResponse.json({ post }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
