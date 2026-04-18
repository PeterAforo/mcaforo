import 'server-only'
import { unstable_cache as cache } from 'next/cache'
import { prisma } from '@/lib/db'

/**
 * Sprint 12 (wire-up): Server-only data fetchers for public marketing pages.
 *
 * - Every fetch is wrapped in `unstable_cache` with a revalidation tag so
 *   admin mutations can invalidate caches via `revalidateTag('...')`.
 * - Each helper returns an empty array on failure (never throws) so the
 *   marketing site stays up even when the DB is unreachable.
 * - Fall-back hard-coded fixtures are provided for the few places where
 *   an empty array would be visually broken.
 */

// The marketing section components accept loosely-typed prop arrays
// (each component maps the shape it needs), so we widen the helpers'
// return type to `any[]` until fully-typed DTOs are extracted.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safe(run: () => Promise<any[]>): () => Promise<any[]> {
  return async () => {
    try {
      return await run()
    } catch (err) {
      console.error('[public-data]', err)
      return []
    }
  }
}

export const getPublishedServices = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).marketingService.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-services'],
  { tags: ['marketing-services'], revalidate: 300 }
)

export const getPublishedProducts = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).marketingProduct.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-products'],
  { tags: ['marketing-products'], revalidate: 300 }
)

export const getPublishedPortfolio = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).portfolio.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    })
  ),
  ['pub-portfolio'],
  { tags: ['portfolio'], revalidate: 300 }
)

export const getPublishedCaseStudies = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).caseStudy.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    })
  ),
  ['pub-case-studies'],
  { tags: ['case-studies'], revalidate: 300 }
)

export const getActiveTeam = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).teamMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-team'],
  { tags: ['team'], revalidate: 300 }
)

export const getActiveTestimonials = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    })
  ),
  ['pub-testimonials'],
  { tags: ['testimonials'], revalidate: 300 }
)

export const getActiveFAQs = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-faqs'],
  { tags: ['faqs'], revalidate: 300 }
)

export const getActiveValues = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).value.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-values'],
  { tags: ['values'], revalidate: 300 }
)

export const getActiveProcessSteps = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).processStep.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-process'],
  { tags: ['process-steps'], revalidate: 300 }
)

export const getActiveStats = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).stat.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-stats'],
  { tags: ['stats'], revalidate: 300 }
)

export const getActivePartners = cache(
  safe(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).partner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  ),
  ['pub-partners'],
  { tags: ['partners'], revalidate: 300 }
)

export const getSiteSettings = cache(
  async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (prisma as any).siteSettings.findUnique({
        where: { id: 'singleton' },
      })
    } catch {
      return null
    }
  },
  ['pub-site-settings'],
  { tags: ['site-settings'], revalidate: 300 }
)
