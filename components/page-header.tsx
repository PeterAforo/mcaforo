'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  backgroundImage?: string
}

const defaultImages: Record<string, string> = {
  about: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1920&q=80',
  services: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1920&q=80',
  blog: 'https://images.unsplash.com/photo-1523365280197-f1783db9fe62?w=1920&q=80',
  'case-studies': 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=1920&q=80',
  contact: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1920&q=80',
  privacy: 'https://images.unsplash.com/photo-1590402494610-2c378a9114c6?w=1920&q=80',
  terms: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1920&q=80',
  default: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1920&q=80',
}

export function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs = [],
  backgroundImage 
}: PageHeaderProps) {
  const pageKey = breadcrumbs[breadcrumbs.length - 1]?.href?.replace('/', '') || 'default'
  const bgImage = backgroundImage || defaultImages[pageKey] || defaultImages.default

  return (
    <section 
      className="relative min-h-[280px] md:min-h-[320px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Dark Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60" />
      
      {/* Content */}
      <div className="container relative z-10 text-center text-white py-16">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center justify-center gap-2 text-sm text-neutral-300 mb-4">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-neutral-500" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="mt-4 text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
