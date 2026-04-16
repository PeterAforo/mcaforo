import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getServiceBySlug, getServices } from '@/lib/mdx'
import { generateSEO } from '@/lib/seo'
import { compileMDX } from '@/lib/mdx-compile'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const services = getServices()
  return services.map((service) => ({
    slug: service.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}

  return generateSEO({
    title: service.meta.title,
    description: service.meta.description,
    pathname: `/services/${slug}`,
  })
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  const MDXContent = await compileMDX(service.content)

  return (
    <article className="py-12">
      <div className="container">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-3xl">
          <header className="mb-12">
            <p className="text-sm font-medium text-primary">
              {service.meta.category}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {service.meta.title}
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              {service.meta.description}
            </p>
          </header>

          <div className="prose">
            <MDXContent />
          </div>

          <div className="mt-12 rounded-xl bg-primary p-8 text-center text-primary-foreground">
            <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
            <p className="mt-2 text-primary-foreground/80">
              Let&apos;s discuss your project and create a custom solution.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button variant="secondary" asChild>
                <Link href="/contact">Book a Call</Link>
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/case-studies">View Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
