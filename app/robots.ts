import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const revalidate = 3600

/**
 * Sprint 6: DB-driven robots.txt. Honors `SiteSettings.noindexAll` (returns
 * a blanket Disallow:/ when true) and supports admin-provided extra rules.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = await ((prisma as any).siteSettings?.findUnique({
    where: { id: 'singleton' },
  }) as Promise<{ noindexAll: boolean; robotsExtra: string | null } | null>).catch(
    () => null
  )

  if (settings?.noindexAll) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: `${baseUrl}/sitemap.xml`,
    }
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/portal/', '/admin/', '/api/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
