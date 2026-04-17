'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Code, Cog, Palette, BarChart3, Shield, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const services = [
  {
    title: 'Web & Mobile Development',
    description: 'Custom websites and mobile apps built with modern technologies for optimal performance.',
    icon: Code,
    href: '/services/web-development',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Business Automation',
    description: 'Streamline operations with custom workflows, integrations, and automation solutions.',
    icon: Cog,
    href: '/services/business-automation',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    title: 'UI/UX Design',
    description: 'User-centered design that creates intuitive and engaging digital experiences.',
    icon: Palette,
    href: '/services/ui-ux-design',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Data Analytics',
    description: 'Transform data into actionable insights with custom dashboards and reporting.',
    icon: BarChart3,
    href: '/services/data-analytics',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    title: 'Cybersecurity',
    description: 'Protect your business with security assessments and best practices implementation.',
    icon: Shield,
    href: '/services/cybersecurity',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    title: 'Managed IT Support',
    description: 'Reliable IT support with SLA-backed service tiers for your business needs.',
    icon: Headphones,
    href: '/services/managed-it',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
]

export function ServicesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container">
        <AnimatedSection className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-mcaforo-gray/10 to-mcaforo-orange/10 text-mcaforo-gray rounded-full text-sm font-medium mb-4">
            What We Offer
          </div>
          <h2 className="text-4xl font-bold tracking-tight">
            Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
              Services
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comprehensive digital solutions tailored to your business needs
          </p>
        </AnimatedSection>

        <StaggerChildren className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />
                
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${service.bgColor} ${service.iconColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-7 w-7" />
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-mcaforo-gray group-hover:to-mcaforo-orange transition-all duration-300">
                  {service.title}
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  {service.description}
                </p>
                
                <Link
                  href={service.href}
                  className="inline-flex items-center text-sm font-semibold text-mcaforo-gray hover:text-mcaforo-orange transition-colors group/link"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <AnimatedSection delay={0.4} className="mt-16 text-center">
          <Button size="lg" variant="outline" className="border-2 hover:bg-gradient-to-r hover:from-mcaforo-gray hover:to-mcaforo-orange hover:text-white hover:border-transparent transition-all duration-300" asChild>
            <Link href="/services">View All Services</Link>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  )
}
