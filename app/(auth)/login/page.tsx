'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const message = searchParams.get('message')
  const error = searchParams.get('error')
  const subscriptionId = searchParams.get('subscriptionId')

  useEffect(() => {
    if (subscriptionId) {
      setPendingSubscriptionId(subscriptionId)
    }
  }, [subscriptionId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // If there's a pending subscription, redirect to billing to complete payment
        if (pendingSubscriptionId) {
          router.push(`/portal/billing?subscriptionId=${pendingSubscriptionId}`)
          return
        }
        
        // Redirect admin users to admin dashboard
        const ADMIN_ROLES = ['ADMIN', 'SUPPORT', 'PM', 'FINANCE']
        const hasAdminRole = data.user?.roles?.some((role: string) => 
          ADMIN_ROLES.includes(role)
        )
        router.push(hasAdminRole ? '/admin' : '/portal')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Invalid credentials')
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4">
      {/* Success/Error Messages */}
      {message === 'verified' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Email verified successfully! {pendingSubscriptionId ? 'Sign in to complete your subscription.' : 'You can now sign in.'}
          </AlertDescription>
        </Alert>
      )}
      {message === 'already-verified' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your email is already verified. Please sign in.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error === 'invalid-token' && 'Invalid or expired verification link.'}
            {error === 'missing-token' && 'Verification token is missing.'}
            {error === 'server-error' && 'An error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to access your client portal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-md space-y-6 px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
