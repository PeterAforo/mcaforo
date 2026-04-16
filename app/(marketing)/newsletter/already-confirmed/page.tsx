import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Already Confirmed',
  description: 'Your newsletter subscription is already confirmed.',
  pathname: '/newsletter/already-confirmed',
})

export default function NewsletterAlreadyConfirmedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Already Confirmed</h1>
        <p className="mt-4 text-muted-foreground">
          Your subscription was already confirmed. You&apos;re all set to
          receive our updates!
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
