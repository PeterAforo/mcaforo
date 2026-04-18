'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react'

const footerNavigation = {
  services: [
    { name: 'Web Development', href: '/services/web-development' },
    { name: 'Business Automation', href: '/services/business-automation' },
    { name: 'UI/UX Design', href: '/services/ui-ux-design' },
    { name: 'Data Analytics', href: '/services/data-analytics' },
    { name: 'Managed IT', href: '/services/managed-it' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Products', href: '/products' },
    { name: 'Projects', href: '/projects' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  resources: [
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'Documentation', href: '#' },
    { name: 'Support', href: '/contact' },
  ],
}

const socialLinks = [
  { name: 'LinkedIn', href: '#', icon: Linkedin },
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'Facebook', href: '#', icon: Facebook },
  { name: 'Instagram', href: '#', icon: Instagram },
]

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating orb animations
      gsap.to(orb1Ref.current, {
        x: 100,
        y: -50,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(orb2Ref.current, {
        x: -80,
        y: 60,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(orb3Ref.current, {
        x: 50,
        y: 80,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <footer ref={footerRef} className="relative overflow-hidden">
      {/* Animated Gradient Orbs - no solid background, inherits from wrapper */}
      <div 
        ref={orb1Ref}
        className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-mcaforo-orange/10 rounded-full blur-[120px]" 
      />
      <div 
        ref={orb2Ref}
        className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-mcaforo-orange/5 rounded-full blur-[100px]" 
      />
      <div 
        ref={orb3Ref}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-mcaforo-gray/10 rounded-full blur-[80px]" 
      />

      <div className="container relative z-10 py-16 md:py-20">
        {/* Navigation Grid - 5 Columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Services</h3>
            <ul className="space-y-3">
              {footerNavigation.services.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-mcaforo-orange transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-mcaforo-orange transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              {footerNavigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-mcaforo-orange transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-mcaforo-orange transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details - 5th Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <a 
                  href="mailto:hello@mcaforo.com" 
                  className="flex items-center gap-2 hover:text-mcaforo-orange transition-colors"
                >
                  <Mail className="h-4 w-4 text-mcaforo-orange" />
                  hello@mcaforo.com
                </a>
              </li>
              <li>
                <a 
                  href="tel:+233249116439" 
                  className="flex items-center gap-2 hover:text-mcaforo-orange transition-colors"
                >
                  <Phone className="h-4 w-4 text-mcaforo-orange" />
                  +233 24 911 6439
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-mcaforo-orange flex-shrink-0 mt-0.5" />
                <span>D75, Salamander Close, Lashibi, Tema-Ghana</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section - Left copyright, Right social icons */}
        <div className="mt-12 border-t border-neutral-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright - Left */}
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} McAforo. All rights reserved.
            </p>
            
            {/* Social Links - Right */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:bg-mcaforo-orange hover:text-white transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
