'use client'

import { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'

interface BottomSectionsWrapperProps {
  children: ReactNode
}

export function BottomSectionsWrapper({ children }: BottomSectionsWrapperProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Seamless gradient background flowing from top to bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black" />
      
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-mcaforo-orange/10 rounded-full blur-[150px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-mcaforo-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-neutral-800/50 rounded-full blur-[100px]" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
        <Footer />
      </div>
    </div>
  )
}
