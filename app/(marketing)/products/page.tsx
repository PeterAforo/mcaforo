'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { GraduationCap, Church, Building2, Leaf, Cloud, Sparkles, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { AnimatedSection } from '@/components/animations/animated-section'

const products = [
  {
    title: 'School Management System',
    description: 'Complete solution for educational institutions with student management, grading, attendance, and parent portals. Streamline your school operations with our AI-powered platform.',
    icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    features: [
      'Student Information System',
      'Online Grading & Report Cards',
      'Attendance Tracking',
      'Parent & Student Portals',
      'Fee Management & Payments',
      'Timetable Management',
      'Library Management',
      'SMS & Email Notifications',
    ],
  },
  {
    title: 'Church Management System',
    description: 'Streamline church operations with member management, donations, events, and communication tools. Build stronger communities with our comprehensive platform.',
    icon: Church,
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
    features: [
      'Member Database & Profiles',
      'Donation & Tithe Tracking',
      'Event Management',
      'Group & Ministry Management',
      'SMS & Email Communication',
      'Attendance Tracking',
      'Financial Reports',
      'Mobile App Access',
    ],
  },
  {
    title: 'Hospital Management System',
    description: 'Comprehensive healthcare solution for patient records, appointments, billing, and pharmacy management. Improve patient care with intelligent automation.',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    features: [
      'Electronic Health Records',
      'Appointment Scheduling',
      'Billing & Insurance',
      'Pharmacy Management',
      'Laboratory Integration',
      'Doctor & Staff Management',
      'Inventory Management',
      'Patient Portal',
    ],
  },
  {
    title: 'Farmer Management System',
    description: 'Empower agricultural businesses with crop tracking, inventory, sales, and weather integration. Make data-driven decisions for better yields.',
    icon: Leaf,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    features: [
      'Crop Planning & Tracking',
      'Inventory Management',
      'Sales & Market Prices',
      'Weather Integration',
      'Farm Worker Management',
      'Equipment Tracking',
      'Financial Reports',
      'Mobile App for Field Use',
    ],
  },
]

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Our Products"
        subtitle="Cloud-based, AI-powered management systems built for African businesses"
        breadcrumbs={[{ label: 'Products' }]}
      />

      <section className="py-16 bg-gradient-to-b from-mcaforo-orange/5 to-white">
        <div className="container">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-mcaforo-orange/10 rounded-full text-sm font-medium mb-4">
              <Cloud className="h-4 w-4 text-mcaforo-orange" />
              Cloud-Based
              <Sparkles className="h-4 w-4 text-mcaforo-orange" />
              AI-Powered
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our enterprise-grade solutions are designed to help businesses in Ghana and across Africa 
              streamline operations, improve efficiency, and drive growth.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {products.map((product, index) => (
        <section 
          key={product.title} 
          className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
        >
          <div className="container">
            <div className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <AnimatedSection direction={index % 2 === 0 ? 'left' : 'right'}>
                <div className="relative">
                  <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className={`absolute -bottom-6 ${index % 2 === 0 ? '-right-6' : '-left-6'} bg-mcaforo-orange text-white p-4 rounded-xl shadow-xl`}>
                    <product.icon className="h-10 w-10" />
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction={index % 2 === 0 ? 'right' : 'left'} delay={0.2}>
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-tight">
                    {product.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {product.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-mcaforo-orange flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <Button size="lg" className="bg-mcaforo-orange hover:bg-mcaforo-orange/90 text-white" asChild>
                      <Link href="/contact">
                        Request Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/contact">Get Pricing</Link>
                    </Button>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
