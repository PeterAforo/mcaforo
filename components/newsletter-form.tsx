'use client'

import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

interface NewsletterFormProps {
  variant?: 'default' | 'inline' | 'card'
  className?: string
}

export function NewsletterForm({
  variant = 'default',
  className,
}: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Check your inbox!',
          description: data.message,
        })
        setEmail('')
      } else {
        throw new Error(data.error || 'Failed to subscribe')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to subscribe',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={className}>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Subscribe'
            )}
          </Button>
        </div>
      </form>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-xl border bg-card p-6 ${className || ''}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Subscribe to our newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest updates in your inbox
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold">Stay Updated</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Subscribe to our newsletter for the latest insights and updates.
      </p>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  )
}
