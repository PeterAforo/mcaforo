import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCaseStudyBySlug, getCaseStudies } from '@/lib/mdx'
import { generateArticleSEO } from '@/lib/seo'
import { compileMDX } from '@/lib/mdx-compile'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const caseStudies = getCaseStudies()
  return caseStudies.map((study) => ({
    slug: study.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudyBySlug(slug)
  if (!study) return {}

  return generateArticleSEO({
    title: study.meta.title,
    description: study.meta.description,
    pathname: `/case-studies/${slug}`,
    publishedTime: study.meta.date,
  })
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = getCaseStudyBySlug(slug)

  if (!study) {
    notFound()
  }

  const MDXContent = await compileMDX(study.content)

  return (
    <article className="py-12">
      <div className="container">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/case-studies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case Studies
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-3xl">
          <header className="mb-12">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{study.meta.industry}</Badge>
              {study.meta.services?.map((service) => (
                <Badge key={service} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              {study.meta.title}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Client: <span className="font-medium">{study.meta.client}</span>
            </p>
            <p className="mt-4 text-xl text-muted-foreground">
              {study.meta.description}
            </p>

            {study.meta.results && (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {study.meta.results.map((result, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-card p-4 text-center"
                  >
                    <p className="font-medium">{result}</p>
                  </div>
                ))}
              </div>
            )}
          </header>

          <div className="prose">
            <MDXContent />
          </div>

          <div className="mt-12 rounded-xl bg-primary p-8 text-center text-primary-foreground">
            <h2 className="text-2xl font-bold">Want Similar Results?</h2>
            <p className="mt-2 text-primary-foreground/80">
              Let&apos;s discuss how we can help your business succeed.
            </p>
            <div className="mt-6">
              <Button variant="secondary" asChild>
                <Link href="/contact">Start Your Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
