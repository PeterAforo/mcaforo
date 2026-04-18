import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { getCaseStudies } from '@/lib/mdx'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Case Studies',
  description:
    'Explore our portfolio of successful projects and see how we have helped businesses achieve their digital goals.',
  pathname: '/case-studies',
})

export default function CaseStudiesPage() {
  const caseStudies = getCaseStudies()

  return (
    <>
      <PageHeader
        title="Case Studies"
        subtitle="Real results from real projects. See how we've helped businesses transform their digital presence and operations."
        breadcrumbs={[{ label: 'Case Studies', href: '/case-studies' }]}
      />

      {/* Case Studies Grid */}
      <section className="py-20">
        <div className="container">
          {caseStudies.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {caseStudies.map((study) => (
                <Card key={study.slug} className="group flex flex-col">
                  <CardHeader>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{study.industry}</Badge>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {study.title}
                    </CardTitle>
                    <CardDescription>
                      <span className="font-medium">{study.client}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {study.description}
                    </p>
                    {study.services && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {study.services.map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/case-studies/${study.slug}`}>
                        Read Case Study
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md text-center">
              <p className="text-muted-foreground">
                Case studies coming soon. Check back later to see our work.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1590402494610-2c378a9114c6?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Want Results Like These?
            </h2>
            <p className="mt-4 text-neutral-300 text-lg">
              Let&apos;s discuss how we can help your business achieve similar
              success.
            </p>
            <div className="mt-8">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200" asChild>
                <Link href="/contact">Start Your Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
