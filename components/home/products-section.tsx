'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, Church, Building2, Leaf, Cloud, Sparkles, ArrowRight } from 'lucide-react'
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/animations/animated-section'

const products = [
  {
    title: 'School Management System',
    description: 'Complete solution for educational institutions with student management, grading, attendance, and parent portals.',
    icon: GraduationCap,
    color: 'from-blue-600 to-indigo-600',
    features: ['Student Records', 'Online Grading', 'Attendance Tracking', 'Parent Portal'],
  },
  {
    title: 'Church Management System',
    description: 'Streamline church operations with member management, donations, events, and communication tools.',
    icon: Church,
    color: 'from-purple-600 to-pink-600',
    features: ['Member Database', 'Donation Tracking', 'Event Management', 'SMS/Email'],
  },
  {
    title: 'Hospital Management System',
    description: 'Comprehensive healthcare solution for patient records, appointments, billing, and pharmacy management.',
    icon: Building2,
    color: 'from-teal-600 to-cyan-600',
    features: ['Patient Records', 'Appointments', 'Billing System', 'Pharmacy'],
  },
  {
    title: 'Farmer Management System',
    description: 'Empower agricultural businesses with crop tracking, inventory, sales, and weather integration.',
    icon: Leaf,
    color: 'from-green-600 to-emerald-600',
    features: ['Crop Tracking', 'Inventory', 'Sales Management', 'Weather Data'],
  },
]

export function ProductsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container">
        <AnimatedSection className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium mb-4">
            <Cloud className="h-4 w-4" />
            Cloud-Based Solutions
            <Sparkles className="h-4 w-4 text-yellow-400" />
            AI-Powered
          </div>
          <h2 className="text-4xl font-bold tracking-tight">
            Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">
              Products
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Enterprise-grade management systems built for African businesses
          </p>
        </AnimatedSection>

        <StaggerChildren className="grid gap-8 md:grid-cols-2" staggerDelay={0.15}>
          {products.map((product) => (
            <StaggerItem key={product.title}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${product.color}`} />
                
                <div className="flex items-start gap-6">
                  <div className={`flex-shrink-0 h-16 w-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-lg`}>
                    <product.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-teal-400 transition-all">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {product.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.features.map((feature) => (
                        <span key={feature} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <Link
                      href="/contact"
                      className="inline-flex items-center text-sm font-semibold text-purple-400 hover:text-teal-400 transition-colors group/link"
                    >
                      Request Demo
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
