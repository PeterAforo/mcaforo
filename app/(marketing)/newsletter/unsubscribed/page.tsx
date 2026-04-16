import { Metadata } from 'next'
import Link from 'next/link'
import { MailX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Unsubscribed',
  description: 'You have been unsubscribed from our newsletter.',
  pathname: '/newsletter/unsubscribed',
})

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MailX className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">You&apos;ve been unsubscribed</h1>
        <p className="mt-4 text-muted-foreground">
          We&apos;re sorry to see you go. You won&apos;t receive any more emails
          from us.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Changed your mind? You can always subscribe again on our website.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
