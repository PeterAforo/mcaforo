'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { SplineScene } from '@/components/ui/spline-scene'
import { Spotlight } from '@/components/ui/spotlight'

const heroContent = [
  {
    title: 'Digital Solutions for',
    highlight: 'Modern Businesses',
    description: 'We help businesses build, automate, and grow with custom software solutions, managed IT services, and expert consulting.',
  },
  {
    title: 'Custom Software',
    highlight: 'Development',
    description: 'From web applications to mobile apps, we build tailored solutions that drive your business forward.',
  },
  {
    title: 'Business Process',
    highlight: 'Automation',
    description: 'Streamline operations, reduce costs, and boost productivity with intelligent automation solutions.',
  },
  {
    title: 'Managed IT',
    highlight: 'Services',
    description: 'Focus on your business while we handle your technology infrastructure with 24/7 support and monitoring.',
  },
  {
    title: 'Data Analytics &',
    highlight: 'Insights',
    description: 'Transform raw data into actionable insights that power smarter business decisions.',
  },
]

export function HeroSpline() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroContent.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative min-h-screen w-full bg-black overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="container relative z-10 h-full">
        <div className="flex flex-col lg:flex-row h-full min-h-screen">
          {/* Left content - 3D Scene (robot) */}
          <div className="relative w-full h-[70vh] min-h-[500px] sm:h-[75vh] lg:h-auto lg:min-h-0 lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:w-[60%] z-10">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full scale-[1.6] sm:scale-[1.4] lg:scale-125"
            />
          </div>

          {/* Right content - Text and CTA */}
          <div className="flex-1 flex flex-col justify-center py-16 lg:py-0 pt-24 lg:ml-auto lg:max-w-[40%] lg:pl-8 relative z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                  {heroContent[currentIndex].title}{' '}
                  <span className="block mt-2 text-5xl md:text-6xl lg:text-7xl font-extrabold text-mcaforo-orange">
                    {heroContent[currentIndex].highlight}
                  </span>
                </h1>
                <p className="mt-6 text-lg text-neutral-300 max-w-lg">
                  {heroContent[currentIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Caption indicators */}
            <div className="flex gap-2 mt-6">
              {heroContent.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-neutral-600 hover:bg-neutral-500'
                  }`}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200" asChild>
                <Link href="/contact">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-neutral-500 text-white bg-neutral-800/50 hover:bg-neutral-700 hover:text-white" asChild>
                <Link href="/services">Explore Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll down indicator */}
      <motion.button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-sm font-medium">Scroll Down</span>
        <ChevronDown className="h-6 w-6" />
      </motion.button>
    </section>
  )
}
