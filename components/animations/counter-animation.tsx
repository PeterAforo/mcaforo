'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export function Counter({ 
  end, 
  suffix = '', 
  prefix = '',
  duration = 2,
  className = '' 
}: CounterProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  )
}
