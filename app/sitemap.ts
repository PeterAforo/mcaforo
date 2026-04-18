import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const revalidate = 3600

/**
 * DB-driven sitemap (Sprint 6). Pulls all published CMS pages, blog posts,
 * case studies, marketing services, products, and portfolio items.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    '', '/about', '/services', '/products', '/projects',
    '/case-studies', '/blog', '/contact', '/privacy', '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  const [pages, blogPosts, caseStudies, services, products, portfolio] = await Promise.all([
    prisma.page.findMany({
      where: { status: 'PUBLISHED' as unknown as 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' as unknown as 'PUBLISHED' },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).caseStudy?.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }) ?? []) as Promise<{ slug: string; updatedAt: Date }[]>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).marketingService?.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }) ?? []) as Promise<{ slug: string; updatedAt: Date }[]>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).marketingProduct?.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }) ?? []) as Promise<{ slug: string; updatedAt: Date }[]>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).portfolio?.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }) ?? []) as Promise<{ slug: string; updatedAt: Date }[]>,
  ])

  const dynamic: MetadataRoute.Sitemap = [
    ...pages.map((p) => ({ url: `${baseUrl}/p/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...blogPosts.map((p) => ({ url: `${baseUrl}/blog/${p.slug}`, lastModified: p.publishedAt ?? p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...caseStudies.map((p) => ({ url: `${baseUrl}/case-studies/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...services.map((p) => ({ url: `${baseUrl}/services/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${baseUrl}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...portfolio.map((p) => ({ url: `${baseUrl}/projects/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ]

  return [...staticPages, ...dynamic]
}
