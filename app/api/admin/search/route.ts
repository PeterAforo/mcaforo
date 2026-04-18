import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { RESOURCES } from '@/lib/cms/resources'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Hit {
  type: string
  id: string
  title: string
  subtitle?: string
  href: string
}

/**
 * Sprint 11: Global admin-side search (cmd+k target).
 *
 * Hits: CMS pages, blog posts, and every registered marketing resource.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ hits: [] })
  const hits: Hit[] = []

  const contains = (field: string) => ({ [field]: { contains: q, mode: 'insensitive' as const } })

  // CMS pages
  try {
    const pages = await prisma.page.findMany({
      where: { OR: [contains('title'), contains('slug')] },
      select: { id: true, title: true, slug: true },
      take: 5,
    })
    for (const p of pages) {
      hits.push({ type: 'Page', id: p.id, title: p.title, subtitle: `/p/${p.slug}`, href: `/admin/cms/${p.id}` })
    }
  } catch { /* ignore */ }

  // Blog
  try {
    const posts = await prisma.blogPost.findMany({
      where: { OR: [contains('title'), contains('slug')] },
      select: { id: true, title: true, slug: true },
      take: 5,
    })
    for (const p of posts) {
      hits.push({ type: 'BlogPost', id: p.id, title: p.title, subtitle: `/blog/${p.slug}`, href: `/admin/blog/${p.id}` })
    }
  } catch { /* ignore */ }

  // Registered content resources
  for (const cfg of Object.values(RESOURCES)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delegate = (prisma as any)[cfg.model]
      if (!delegate) continue
      const rows = await delegate.findMany({
        where: { OR: cfg.searchFields.map(contains) },
        take: 3,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of rows as any[]) {
        hits.push({
          type: cfg.labelSingular,
          id: r.id,
          title: String(r[cfg.primaryField] ?? r.id),
          subtitle: cfg.secondaryField ? String(r[cfg.secondaryField] ?? '') : undefined,
          href: `/admin/content/${cfg.slug}/${r.id}`,
        })
      }
    } catch { /* ignore missing models */ }
  }

  return NextResponse.json({ hits: hits.slice(0, 30) })
}
