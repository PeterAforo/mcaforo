import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'McAforo - Digital Solutions for Modern Businesses',
    template: '%s | McAforo',
  },
  description:
    'McAforo provides web development, business automation, UI/UX design, and managed IT services to help businesses thrive in the digital age.',
  keywords: [
    'web development',
    'business automation',
    'UI/UX design',
    'managed IT',
    'Ghana',
    'digital solutions',
  ],
  authors: [{ name: 'McAforo' }],
  creator: 'McAforo',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'McAforo',
    title: 'McAforo - Digital Solutions for Modern Businesses',
    description:
      'McAforo provides web development, business automation, UI/UX design, and managed IT services.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'McAforo - Digital Solutions for Modern Businesses',
    description:
      'McAforo provides web development, business automation, UI/UX design, and managed IT services.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
