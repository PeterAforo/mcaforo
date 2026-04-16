'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Globe, Smartphone, Code2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const projects = [
  {
    client: 'GhanaTech Solutions',
    title: 'E-Commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration and inventory management.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    services: ['Web Development', 'Payment Integration'],
    icon: Globe,
  },
  {
    client: 'Accra Medical Center',
    title: 'Hospital Management System',
    description: 'Comprehensive patient management and appointment scheduling system.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    services: ['Software Development', 'Database Design'],
    icon: Database,
  },
  {
    client: 'FarmConnect Ghana',
    title: 'Mobile Farming App',
    description: 'Mobile application connecting farmers with buyers and providing market insights.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    services: ['Mobile App', 'API Development'],
    icon: Smartphone,
  },
  {
    client: 'EduFirst Academy',
    title: 'Learning Management System',
    description: 'Online learning platform with video courses, assessments, and certifications.',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
    services: ['Web Development', 'Cloud Hosting'],
    icon: Code2,
  },
]

export function ProjectsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container">
        <AnimatedSection className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
              Our Portfolio
            </div>
            <h2 className="text-4xl font-bold tracking-tight">
              Featured{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-500">
                Projects
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Explore some of our successful client projects and the solutions we delivered
            </p>
          </div>
          <Button variant="outline" className="mt-6 md:mt-0 border-2 hover:bg-gradient-to-r hover:from-purple-600 hover:to-teal-500 hover:text-white hover:border-transparent" asChild>
            <Link href="/projects">View All Projects</Link>
          </Button>
        </AnimatedSection>

        <StaggerChildren className="grid gap-8 md:grid-cols-2" staggerDelay={0.15}>
          {projects.map((project) => (
            <StaggerItem key={project.title}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                        <project.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white/80 text-sm font-medium">{project.client}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.services.map((service) => (
                      <span key={service} className="px-3 py-1 bg-gradient-to-r from-purple-100 to-teal-100 text-purple-700 rounded-full text-xs font-medium">
                        {service}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    href="/projects"
                    className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-teal-600 transition-colors group/link"
                  >
                    View Project
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
