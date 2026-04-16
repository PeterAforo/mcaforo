'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Case Studies', href: '/case-studies' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300",
      isHomePage 
        ? scrolled 
          ? "bg-black/95 backdrop-blur border-b border-neutral-800" 
          : "bg-transparent border-none"
        : "bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <nav className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo.png" 
            alt="McAforo" 
            width={64} 
            height={64}
            className="rounded-full"
          />
        </Link>

        <div className="hidden md:flex md:items-center md:justify-center flex-1">
          <div className="flex gap-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : isHomePage ? 'text-neutral-300' : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex md:items-center md:gap-x-4">
          <Button variant="ghost" className={isHomePage ? "text-neutral-300 hover:text-white hover:bg-neutral-800" : ""} asChild>
            <Link href="/login">Client Portal</Link>
          </Button>
          <Button asChild>
            <Link href="/contact">Get Started</Link>
          </Button>
        </div>

        <div className="flex md:hidden">
          <button
            type="button"
            className={cn(
              "-m-2.5 inline-flex items-center justify-center rounded-md p-2.5",
              isHomePage ? "text-neutral-300" : "text-muted-foreground"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className={cn("md:hidden", isHomePage ? "bg-black" : "bg-background")}>
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : isHomePage 
                      ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 px-3">
              <Button variant="outline" asChild className={cn("w-full", isHomePage && "border-neutral-700 text-neutral-300 hover:bg-neutral-800")}>
                <Link href="/login">Client Portal</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
