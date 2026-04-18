import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { unstable_cache as cache } from 'next/cache'

import { prisma } from '@/lib/db'
import { getBlock } from '@/lib/cms/blocks'

/**
 * Public renderer for CMS-managed pages.
 *
 * Route: /p/[slug]
 * Uses `unstable_cache` tagged with `page:<slug>` so admin publish flows can
 * target-invalidate via `revalidateTag('page:<slug>')`.
 *
 * We intentionally keep this under /p/ during Sprint 3 so it doesn't clash
 * with existing hardcoded marketing routes in (marketing)/. Sprint 4 migrates
 * those routes over.
 */

type Ctx = { params: Promise<{ slug: string }> }

const getPublishedPage = cache(
  async (slug: string) => {
    return prisma.page.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        sections: {
          where: { isActive: true, blockType: { not: null } },
          orderBy: { order: 'asc' },
        },
      },
    })
  },
  ['cms-page'],
  { tags: ['pages'] }
)

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) return {}
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? page.excerpt ?? undefined,
    openGraph: {
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? page.excerpt ?? undefined,
      images: page.featuredImage ? [page.featuredImage] : undefined,
    },
  }
}

export default async function CmsPagePage({ params }: Ctx) {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) notFound()

  return (
    <main>
      {page.sections.map((section) => {
        const block = getBlock(section.blockType)
        if (!block) {
          return (
            <div
              key={section.id}
              className="container py-4 text-sm text-yellow-800 bg-yellow-50 border-y"
            >
              Unknown block type: <code>{section.blockType}</code>
            </div>
          )
        }
        // Validate before render; skip silently on invalid data so one bad
        // block can't take down the whole page.
        const parse = block.schema.safeParse(section.data)
        if (!parse.success) {
          console.warn(
            `[cms/page] invalid data for ${section.blockType}`,
            parse.error.flatten()
          )
          return null
        }
        const Render = block.render
        return <Render key={section.id} data={parse.data} />
      })}
    </main>
  )
}
