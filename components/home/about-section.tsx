'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedSection } from '@/components/animations/animated-section'
import { CheckCircle2 } from 'lucide-react'

const highlights = [
  'Over 5 years of industry experience',
  'Team of certified professionals',
  'Cloud-based & AI-powered solutions',
  'Dedicated support & maintenance',
]

export function AboutSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-mcaforo-gray/5">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection direction="left">
            <div className="relative">
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800"
                  alt="McAforo Team"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-mcaforo-orange text-white p-6 rounded-xl shadow-xl">
                <div className="text-4xl font-bold">5+</div>
                <div className="text-sm opacity-90">Years of Excellence</div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right" delay={0.2}>
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-gray rounded-full text-sm font-medium">
                About McAforo
              </div>
              <h2 className="text-4xl font-bold tracking-tight">
                Empowering Businesses with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                  Digital Innovation
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                McAforo is a leading technology company based in Ghana, dedicated to 
                transforming businesses through innovative digital solutions. We specialize 
                in creating custom software, web applications, and AI-powered management 
                systems that drive growth and efficiency.
              </p>
              <p className="text-muted-foreground">
                Our team of experienced developers, designers, and consultants work 
                closely with clients to understand their unique challenges and deliver 
                solutions that exceed expectations.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {highlights.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-mcaforo-orange flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Button size="lg" className="bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange hover:from-mcaforo-gray/90 hover:to-mcaforo-orange/90" asChild>
                  <Link href="/about">Learn More About Us</Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
