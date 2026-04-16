import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getContentBySlug } from '@/lib/mdx'
import { generateSEO } from '@/lib/seo'
import { compileMDX } from '@/lib/mdx-compile'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = generateSEO({
  title: 'Privacy Policy',
  description: 'How McAforo collects, uses, and protects your personal information.',
  pathname: '/privacy',
})

export default async function PrivacyPage() {
  const content = getContentBySlug('legal', 'privacy')

  if (!content) {
    notFound()
  }

  const MDXContent = await compileMDX(content.content)

  return (
    <>
      <PageHeader
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information."
        breadcrumbs={[{ label: 'Privacy Policy', href: '/privacy' }]}
      />
      <article className="py-12">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="prose">
              <MDXContent />
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
