'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Globe, Smartphone, Code2, Database, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { NewsletterSection } from '@/components/newsletter-section'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const projects = [
  {
    client: 'GhanaTech Solutions',
    title: 'E-Commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration, inventory management, and real-time order tracking. Built with Next.js and integrated with local payment providers.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    services: ['Web Development', 'Payment Integration', 'Cloud Hosting'],
    icon: Globe,
    color: 'from-blue-600 to-cyan-600',
    results: ['200% increase in online sales', '50% reduction in order processing time'],
  },
  {
    client: 'Accra Medical Center',
    title: 'Hospital Management System',
    description: 'Comprehensive patient management and appointment scheduling system with electronic health records, billing integration, and pharmacy management.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    services: ['Software Development', 'Database Design', 'Training'],
    icon: Database,
    color: 'from-teal-600 to-emerald-600',
    results: ['40% faster patient check-in', '99.9% uptime achieved'],
  },
  {
    client: 'FarmConnect Ghana',
    title: 'Mobile Farming App',
    description: 'Mobile application connecting farmers with buyers and providing market insights, weather data, and agricultural best practices.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    services: ['Mobile App Development', 'API Development', 'UI/UX Design'],
    icon: Smartphone,
    color: 'from-green-600 to-lime-600',
    results: ['5,000+ active farmers', '30% better market prices for users'],
  },
  {
    client: 'EduFirst Academy',
    title: 'Learning Management System',
    description: 'Online learning platform with video courses, assessments, certifications, and student progress tracking for a leading educational institution.',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
    services: ['Web Development', 'Cloud Hosting', 'Content Management'],
    icon: Code2,
    color: 'from-purple-600 to-pink-600',
    results: ['10,000+ students enrolled', '95% course completion rate'],
  },
  {
    client: 'Tema Port Authority',
    title: 'Logistics Tracking System',
    description: 'Real-time cargo tracking and logistics management system with automated notifications and reporting dashboards.',
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800',
    services: ['Software Development', 'API Integration', 'Data Analytics'],
    icon: Globe,
    color: 'from-orange-600 to-red-600',
    results: ['60% faster cargo processing', 'Real-time visibility for 100+ clients'],
  },
  {
    client: 'Grace Community Church',
    title: 'Church Management Platform',
    description: 'Complete church management solution with member database, donation tracking, event management, and communication tools.',
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
    services: ['Web Development', 'Mobile App', 'Payment Integration'],
    icon: Database,
    color: 'from-indigo-600 to-purple-600',
    results: ['3,000+ members managed', '50% increase in online donations'],
  },
]

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Our Projects"
        subtitle="Explore our portfolio of successful client projects and solutions"
        breadcrumbs={[{ label: 'Projects' }]}
      />

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container">
          <AnimatedSection className="text-center mb-16">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We&apos;ve had the privilege of working with amazing clients across Ghana and beyond. 
              Here are some of the projects we&apos;re proud to have delivered.
            </p>
          </AnimatedSection>

          <StaggerChildren className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {projects.map((project) => (
              <StaggerItem key={project.title}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`} />
                    <div className="absolute top-4 left-4">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${project.color} flex items-center justify-center shadow-lg`}>
                        <project.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-white/80 text-sm font-medium">{project.client}</span>
                      <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-muted-foreground mb-4 flex-1">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.services.map((service) => (
                        <span key={service} className={`px-3 py-1 bg-gradient-to-r from-purple-100 to-teal-100 text-purple-700 rounded-full text-xs font-medium`}>
                          {service}
                        </span>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">KEY RESULTS</div>
                      <ul className="space-y-1">
                        {project.results.map((result) => (
                          <li key={result} className="text-sm text-green-600 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-teal-600">
        <div className="container">
          <AnimatedSection className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Let&apos;s discuss how we can help bring your vision to life with our expertise.
            </p>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100" asChild>
              <Link href="/contact">
                Get in Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      <NewsletterSection />
    </>
  )
}
