'use client'

import { useState } from 'react'
import { Loader2, Mail, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export function NewsletterSection() {
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

  return (
    <section className="relative py-12 overflow-hidden">
      {/* Background with gradient - McAforo Blue to Orange */}
      <div className="absolute inset-0 bg-gradient-to-r from-mcaforo-blue via-mcaforo-blue/80 to-mcaforo-orange" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-mcaforo-light-blue/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-mcaforo-orange/20 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left side - Text */}
          <div className="md:w-2/5 text-center md:text-left shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm mb-3">
              <Sparkles className="h-4 w-4" />
              <span>Stay ahead of the curve</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Subscribe to Our Newsletter
            </h2>
            
            <p className="text-white/70">
              Get the latest insights on technology and digital transformation.
            </p>
          </div>
          
          {/* Right side - Form */}
          <div className="md:w-3/5 w-full">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-white/50"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-11 px-6 bg-white text-black hover:bg-neutral-200"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Subscribe'
                )}
              </Button>
            </form>
            <p className="mt-2 text-xs text-white/50 text-center md:text-left">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
