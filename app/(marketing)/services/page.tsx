import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code, Cog, Palette, BarChart3, Shield, Headphones } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { NewsletterSection } from '@/components/newsletter-section'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Services',
  description:
    'Explore our comprehensive digital services including web development, business automation, UI/UX design, and managed IT support.',
  pathname: '/services',
})

const services = [
  {
    title: 'Web & Mobile Development',
    description:
      'Custom websites and mobile apps built with modern technologies for optimal performance and user experience.',
    icon: Code,
    href: '/services/web-development',
    features: [
      'Custom web applications',
      'Mobile apps (iOS & Android)',
      'E-commerce platforms',
      'Progressive Web Apps',
    ],
  },
  {
    title: 'Business Automation',
    description:
      'Streamline operations with custom workflows, integrations, and automation solutions that save time and reduce errors.',
    icon: Cog,
    href: '/services/business-automation',
    features: [
      'Workflow automation',
      'System integrations',
      'Custom API development',
      'Process optimization',
    ],
  },
  {
    title: 'UI/UX Design',
    description:
      'User-centered design that creates intuitive and engaging digital experiences your customers will love.',
    icon: Palette,
    href: '/services/ui-ux-design',
    features: [
      'User research',
      'Wireframing & prototyping',
      'Visual design',
      'Usability testing',
    ],
  },
  {
    title: 'Data Analytics',
    description:
      'Transform data into actionable insights with custom dashboards and reporting solutions.',
    icon: BarChart3,
    href: '/services/data-analytics',
    features: [
      'Custom dashboards',
      'Business intelligence',
      'Data visualization',
      'Reporting automation',
    ],
  },
  {
    title: 'Cybersecurity',
    description:
      'Protect your business with security assessments and best practices implementation.',
    icon: Shield,
    href: '/services/cybersecurity',
    features: [
      'Security assessments',
      'Vulnerability testing',
      'Security training',
      'Compliance support',
    ],
  },
  {
    title: 'Managed IT Support',
    description:
      'Reliable IT support with SLA-backed service tiers for your business needs.',
    icon: Headphones,
    href: '/services/managed-it',
    features: [
      'Web hosting',
      'Domain management',
      'Website maintenance',
      '24/7 monitoring',
    ],
  },
]

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="Our Services"
        subtitle="Comprehensive digital solutions tailored to your business needs. From development to support, we've got you covered."
        breadcrumbs={[{ label: 'Services', href: '/services' }]}
      />

      {/* Services Grid */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className="group flex flex-col">
                <CardHeader>
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <service.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={service.href}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recurring Services */}
      <section className="border-y bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Recurring Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Keep your business running smoothly with our managed services
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Domain Registration', desc: 'Register and manage your domains' },
              { title: 'Web Hosting', desc: 'Fast, secure hosting solutions' },
              { title: 'Website Care Plans', desc: 'Updates, backups, and monitoring' },
              { title: 'IT Support', desc: 'SLA-backed technical support' },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border bg-card p-6 text-center">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Not Sure What You Need?
            </h2>
            <p className="mt-4 text-neutral-300 text-lg">
              Book a free consultation and we&apos;ll help you identify the best
              solutions for your business.
            </p>
            <div className="mt-8">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200" asChild>
                <Link href="/contact">Book a Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <NewsletterSection />
    </>
  )
}
