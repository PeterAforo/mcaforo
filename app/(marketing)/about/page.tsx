import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Target, Award, Heart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { NewsletterSection } from '@/components/newsletter-section'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'About Us',
  description:
    'Learn about McAforo - our mission, values, and the team behind your digital success.',
  pathname: '/about',
})

const values = [
  {
    title: 'Client-Focused',
    description:
      'Your success is our success. We listen, understand, and deliver solutions that truly meet your needs.',
    icon: Users,
  },
  {
    title: 'Excellence',
    description:
      'We hold ourselves to the highest standards in everything we do, from code quality to customer service.',
    icon: Award,
  },
  {
    title: 'Innovation',
    description:
      'We stay ahead of technology trends to bring you modern, future-proof solutions.',
    icon: Target,
  },
  {
    title: 'Integrity',
    description:
      'Honest communication, transparent pricing, and ethical business practices guide all our interactions.',
    icon: Heart,
  },
]

const process = [
  {
    step: 1,
    title: 'Discovery',
    description:
      'We start by understanding your business, goals, challenges, and target audience through in-depth consultations.',
  },
  {
    step: 2,
    title: 'Strategy',
    description:
      'Based on our findings, we develop a comprehensive strategy and project plan tailored to your needs.',
  },
  {
    step: 3,
    title: 'Design',
    description:
      'Our designers create intuitive, beautiful interfaces that align with your brand and delight your users.',
  },
  {
    step: 4,
    title: 'Development',
    description:
      'Our engineers build your solution using modern technologies and best practices for quality and performance.',
  },
  {
    step: 5,
    title: 'Testing',
    description:
      'Rigorous quality assurance ensures everything works perfectly before launch.',
  },
  {
    step: 6,
    title: 'Launch & Support',
    description:
      'We deploy your solution and provide ongoing support to ensure continued success.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About McAforo"
        subtitle="We are a team of passionate technologists dedicated to helping businesses thrive in the digital age."
        breadcrumbs={[{ label: 'About', href: '/about' }]}
      />

      {/* Mission Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
              <p className="mt-4 text-muted-foreground">
                To empower businesses with innovative technology solutions that
                drive growth, efficiency, and competitive advantage. We believe
                that every business, regardless of size, deserves access to
                world-class digital tools and expertise.
              </p>
              <p className="mt-4 text-muted-foreground">
                We combine deep technical expertise with a genuine understanding
                of business challenges to deliver solutions that make a real
                difference. Our approach is collaborative, transparent, and
                focused on long-term success.
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&q=80"
                alt="African professionals in traditional attire"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=800&q=80"
                alt="African woman in traditional kente"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2 rounded-xl bg-card p-8 shadow-lg">
              <h3 className="text-xl font-semibold">Why Choose McAforo?</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>Local expertise with global standards</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>End-to-end solutions from design to deployment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>Ongoing support and maintenance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>Transparent pricing and communication</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>Proven track record of successful projects</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Our Values</h2>
            <p className="mt-4 text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How We Work</h2>
            <p className="mt-4 text-muted-foreground">
              Our proven process ensures successful project delivery
            </p>
          </div>
          <div className="mt-12">
            <div className="relative">
              <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-border md:left-1/2 md:block md:-translate-x-1/2" />
              <div className="space-y-8">
                {process.map((item, index) => (
                  <div
                    key={item.step}
                    className={`relative flex items-start gap-6 md:gap-12 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className="hidden flex-1 md:block" />
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <div className="flex-1 rounded-lg border bg-card p-4">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Work Together?
            </h2>
            <p className="mt-4 text-neutral-300 text-lg">
              Let&apos;s discuss how we can help transform your business with
              technology.
            </p>
            <div className="mt-8">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200" asChild>
                <Link href="/contact">Get in Touch</Link>
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
