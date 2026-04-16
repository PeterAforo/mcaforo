'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'

interface ParallaxSectionProps {
  imageUrl: string
  children: React.ReactNode
  className?: string
  overlayColor?: string
  speed?: number
}

export function ParallaxSection({ 
  imageUrl, 
  children, 
  className = '',
  overlayColor = 'bg-black/60',
  speed = 0.5
}: ParallaxSectionProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 30}%`])

  return (
    <section ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div 
        className="absolute inset-0 -z-10"
        style={{ y }}
      >
        <Image
          src={imageUrl}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className={`absolute inset-0 ${overlayColor}`} />
      </motion.div>
      {children}
    </section>
  )
}
