'use client'

import { ParallaxSection } from '@/components/animations/parallax-section'
import { Counter } from '@/components/animations/counter-animation'
import { AnimatedSection } from '@/components/animations/animated-section'

const stats = [
  { value: 50, suffix: '+', label: 'Projects Delivered' },
  { value: 30, suffix: '+', label: 'Happy Clients' },
  { value: 5, suffix: '+', label: 'Years Experience' },
  { value: 99, suffix: '%', label: 'Client Satisfaction' },
]

export function StatsSection() {
  return (
    <ParallaxSection
      imageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600"
      overlayColor="bg-gradient-to-r from-mcaforo-blue/90 to-mcaforo-orange/80"
      className="py-20"
    >
      <div className="container">
        <AnimatedSection className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                <Counter end={stat.value} suffix={stat.suffix} duration={2.5} />
              </div>
              <div className="text-sm md:text-base text-gray-300 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </AnimatedSection>
      </div>
    </ParallaxSection>
  )
}
