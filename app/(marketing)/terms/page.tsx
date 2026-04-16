import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getContentBySlug } from '@/lib/mdx'
import { generateSEO } from '@/lib/seo'
import { compileMDX } from '@/lib/mdx-compile'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = generateSEO({
  title: 'Terms of Service',
  description: 'Terms and conditions for using McAforo services.',
  pathname: '/terms',
})

export default async function TermsPage() {
  const content = getContentBySlug('legal', 'terms')

  if (!content) {
    notFound()
  }

  const MDXContent = await compileMDX(content.content)

  return (
    <>
      <PageHeader
        title="Terms of Service"
        subtitle="Terms and conditions for using McAforo services."
        breadcrumbs={[{ label: 'Terms of Service', href: '/terms' }]}
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
