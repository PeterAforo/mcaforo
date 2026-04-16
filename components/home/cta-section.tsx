'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ParallaxSection } from '@/components/animations/parallax-section'
import { AnimatedSection } from '@/components/animations/animated-section'
import { Phone, MapPin, ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <ParallaxSection
      imageUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600"
      overlayColor="bg-gradient-to-r from-mcaforo-blue/95 to-mcaforo-orange/90"
      className="py-24"
    >
      <div className="container">
        <AnimatedSection className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let&apos;s discuss how we can help you achieve your digital goals.
            Book a free consultation today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-3 text-white">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-400">Call Us</div>
                <div className="font-semibold">0249116439</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-400">Visit Us</div>
                <div className="font-semibold">D75, Salamander Close, Lashibi, Tema</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-mcaforo-blue hover:bg-gray-100 text-lg px-8" asChild>
              <Link href="/contact">
                Book a Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8" asChild>
              <Link href="/projects">View Our Work</Link>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </ParallaxSection>
  )
}
