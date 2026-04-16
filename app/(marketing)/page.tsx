import Link from 'next/link'
import {
  ArrowRight,
  Code,
  Cog,
  Palette,
  BarChart3,
  Shield,
  Headphones,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { HeroSpline } from '@/components/hero-spline'
import { NewsletterSection } from '@/components/newsletter-section'

const services = [
  {
    title: 'Web & Mobile Development',
    description:
      'Custom websites and mobile apps built with modern technologies for optimal performance.',
    icon: Code,
    href: '/services/web-development',
  },
  {
    title: 'Business Automation',
    description:
      'Streamline operations with custom workflows, integrations, and automation solutions.',
    icon: Cog,
    href: '/services/business-automation',
  },
  {
    title: 'UI/UX Design',
    description:
      'User-centered design that creates intuitive and engaging digital experiences.',
    icon: Palette,
    href: '/services/ui-ux-design',
  },
  {
    title: 'Data Analytics',
    description:
      'Transform data into actionable insights with custom dashboards and reporting.',
    icon: BarChart3,
    href: '/services/data-analytics',
  },
  {
    title: 'Cybersecurity',
    description:
      'Protect your business with security assessments and best practices implementation.',
    icon: Shield,
    href: '/services/cybersecurity',
  },
  {
    title: 'Managed IT Support',
    description:
      'Reliable IT support with SLA-backed service tiers for your business needs.',
    icon: Headphones,
    href: '/services/managed-it',
  },
]

const stats = [
  { value: '50+', label: 'Projects Delivered' },
  { value: '30+', label: 'Happy Clients' },
  { value: '5+', label: 'Years Experience' },
  { value: '99%', label: 'Client Satisfaction' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section with 3D Spline */}
      <HeroSpline />

      {/* Services Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comprehensive digital solutions tailored to your business needs
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={service.href}
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Let&apos;s discuss how we can help you achieve your digital goals.
              Book a free consultation today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact">Book a Call</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/case-studies">View Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />
    </>
  )
}
