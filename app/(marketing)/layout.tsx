'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ChatWidget } from '@/components/chatbot/chat-widget'
import { NewsletterSection } from '@/components/newsletter-section'
import { BottomSectionsWrapper } from '@/components/home/bottom-sections-wrapper'

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
      {!isHomePage && (
        <BottomSectionsWrapper>
          <NewsletterSection />
        </BottomSectionsWrapper>
      )}
      <ChatWidget />
    </div>
  )
}
