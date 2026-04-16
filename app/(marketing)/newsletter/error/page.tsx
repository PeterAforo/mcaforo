'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

const errorMessages: Record<string, string> = {
  'missing-token': 'The confirmation link is incomplete.',
  'invalid-token': 'The confirmation link is invalid or has expired.',
  'server-error': 'Something went wrong. Please try again later.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'server-error'
  const message = errorMessages[reason] || errorMessages['server-error']

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-4 text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  )
}

export default function NewsletterErrorPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ErrorContent />
      </Suspense>
    </div>
  )
}
