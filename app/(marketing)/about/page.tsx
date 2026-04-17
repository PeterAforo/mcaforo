'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Users, Target, Award, Heart, CheckCircle2, Lightbulb, Rocket, Search, PenTool, Code2, TestTube, HeadphonesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { NewsletterSection } from '@/components/newsletter-section'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const values = [
  {
    title: 'Client-Focused',
    description:
      'Your success is our success. We listen, understand, and deliver solutions that truly meet your needs.',
    icon: Users,
    color: 'from-mcaforo-gray to-mcaforo-orange',
  },
  {
    title: 'Excellence',
    description:
      'We hold ourselves to the highest standards in everything we do, from code quality to customer service.',
    icon: Award,
    color: 'from-mcaforo-orange to-mcaforo-orange',
  },
  {
    title: 'Innovation',
    description:
      'We stay ahead of technology trends to bring you modern, future-proof solutions.',
    icon: Lightbulb,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Integrity',
    description:
      'Honest communication, transparent pricing, and ethical business practices guide all our interactions.',
    icon: Heart,
    color: 'from-rose-500 to-pink-500',
  },
]

const process = [
  {
    step: 1,
    title: 'Discovery',
    description:
      'We start by understanding your business, goals, challenges, and target audience through in-depth consultations.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Strategy',
    description:
      'Based on our findings, we develop a comprehensive strategy and project plan tailored to your needs.',
    icon: Rocket,
  },
  {
    step: 3,
    title: 'Design',
    description:
      'Our designers create intuitive, beautiful interfaces that align with your brand and delight your users.',
    icon: PenTool,
  },
  {
    step: 4,
    title: 'Development',
    description:
      'Our engineers build your solution using modern technologies and best practices for quality and performance.',
    icon: Code2,
  },
  {
    step: 5,
    title: 'Testing',
    description:
      'Rigorous quality assurance ensures everything works perfectly before launch.',
    icon: TestTube,
  },
  {
    step: 6,
    title: 'Launch & Support',
    description:
      'We deploy your solution and provide ongoing support to ensure continued success.',
    icon: HeadphonesIcon,
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
            <AnimatedSection direction="left">
              <div className="inline-block px-4 py-2 bg-mcaforo-gray/10 text-mcaforo-gray rounded-full text-sm font-medium mb-4">
                Our Purpose
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Our{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                  Mission
                </span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
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
            </AnimatedSection>
            <AnimatedSection direction="right" delay={0.2}>
              <div className="relative">
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&q=80"
                    alt="African professionals in traditional attire"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange text-white p-5 rounded-xl shadow-xl">
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm opacity-90">Projects Delivered</div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-mcaforo-gray/5 via-white to-mcaforo-orange/5">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <AnimatedSection direction="left" className="order-2 lg:order-1">
              <div className="relative">
                <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=800&q=80"
                    alt="African woman in traditional kente"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-xl border">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">5+ Years</div>
                      <div className="text-xs text-muted-foreground">Experience</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="right" delay={0.2} className="order-1 lg:order-2">
              <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-orange rounded-full text-sm font-medium mb-4">
                Why Us
              </div>
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Why Choose{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                  McAforo?
                </span>
              </h3>
              <ul className="space-y-4">
                {[
                  'Local expertise with global standards',
                  'End-to-end solutions from design to deployment',
                  'Ongoing support and maintenance',
                  'Transparent pricing and communication',
                  'Proven track record of successful projects',
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <CheckCircle2 className="h-5 w-5 text-mcaforo-orange flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container">
          <AnimatedSection className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-block px-4 py-2 bg-mcaforo-gray/10 text-mcaforo-gray rounded-full text-sm font-medium mb-4">
              What Drives Us
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                Values
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The principles that guide everything we do
            </p>
          </AnimatedSection>
          <StaggerChildren className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group text-center p-6 rounded-2xl bg-white border shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${value.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold">{value.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container">
          <AnimatedSection className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-orange rounded-full text-sm font-medium mb-4">
              Our Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How We{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                Work
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our proven process ensures successful project delivery
            </p>
          </AnimatedSection>
          <StaggerChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {process.map((item) => (
              <StaggerItem key={item.step}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-mcaforo-gray/10 to-mcaforo-orange/10 rounded-bl-full" />
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-mcaforo-gray to-mcaforo-orange flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-mcaforo-orange">STEP {item.step}</span>
                      </div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-mcaforo-gray/90 to-mcaforo-orange/80" />
        <div className="container relative z-10">
          <AnimatedSection className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to Work Together?
            </h2>
            <p className="mt-6 text-xl text-white/90">
              Let&apos;s discuss how we can help transform your business with
              technology.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-mcaforo-gray hover:bg-gray-100 text-lg px-8" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8" asChild>
                <Link href="/services">Our Services</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />
    </>
  )
}
