'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Code, Cog, Palette, BarChart3, Shield, Headphones, Globe, Server, Wrench, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { NewsletterSection } from '@/components/newsletter-section'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const services = [
  {
    title: 'Web & Mobile Development',
    description:
      'Custom websites and mobile apps built with modern technologies for optimal performance and user experience.',
    icon: Code,
    href: '/services/web-development',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
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
    color: 'from-mcaforo-gray to-mcaforo-orange',
    bgColor: 'bg-mcaforo-gray/10',
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
    color: 'from-mcaforo-orange to-mcaforo-yellow',
    bgColor: 'bg-mcaforo-orange/10',
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
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
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
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
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
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    features: [
      'Web hosting',
      'Domain management',
      'Website maintenance',
      '24/7 monitoring',
    ],
  },
]

const recurringServices = [
  { title: 'Domain Registration', desc: 'Register and manage your domains', icon: Globe },
  { title: 'Web Hosting', desc: 'Fast, secure hosting solutions', icon: Server },
  { title: 'Website Care Plans', desc: 'Updates, backups, and monitoring', icon: Wrench },
  { title: 'IT Support', desc: 'SLA-backed technical support', icon: Clock },
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
          <StaggerChildren className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {services.map((service) => (
              <StaggerItem key={service.title}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />
                  
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${service.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <service.icon className="h-7 w-7" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-mcaforo-gray group-hover:to-mcaforo-orange transition-all duration-300">
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6 flex-1">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${service.color}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={service.href}
                    className="inline-flex items-center text-sm font-semibold text-mcaforo-gray hover:text-mcaforo-orange transition-colors group/link"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Recurring Services */}
      <section className="py-20 bg-gradient-to-br from-mcaforo-gray/5 via-white to-mcaforo-orange/5">
        <div className="container">
          <AnimatedSection className="mx-auto max-w-2xl text-center mb-12">
            <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-orange rounded-full text-sm font-medium mb-4">
              Managed Services
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Recurring{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                Services
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Keep your business running smoothly with our managed services
            </p>
          </AnimatedSection>
          <StaggerChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
            {recurringServices.map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group rounded-2xl border bg-white p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-mcaforo-gray to-mcaforo-orange flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
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
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-mcaforo-gray/90 to-mcaforo-orange/80" />
        <div className="container relative z-10">
          <AnimatedSection className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Not Sure What You Need?
            </h2>
            <p className="mt-6 text-xl text-white/90">
              Book a free consultation and we&apos;ll help you identify the best
              solutions for your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-mcaforo-gray hover:bg-gray-100 text-lg px-8" asChild>
                <Link href="/contact">Book a Consultation</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8" asChild>
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <NewsletterSection />
    </>
  )
}
