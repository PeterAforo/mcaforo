'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ChatWidget } from '@/components/chatbot/chat-widget'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={isHomePage ? "flex-1" : "flex-1 pt-16"}>{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
