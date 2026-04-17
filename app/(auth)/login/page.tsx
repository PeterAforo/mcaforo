'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-black via-mcaforo-gray to-black overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-mcaforo-orange/20 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-mcaforo-orange/10 rounded-full blur-[80px]"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Image 
              src="/logo.png" 
              alt="McAforo" 
              width={100} 
              height={100}
              className="mx-auto mb-8"
            />
            <h1 className="text-4xl font-bold mb-4">Welcome to McAforo</h1>
            <p className="text-xl text-gray-300 max-w-md">
              Your trusted partner for digital transformation and business automation solutions.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 grid grid-cols-2 gap-6 text-center"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-bold text-mcaforo-orange">50+</div>
              <div className="text-sm text-gray-400">Projects Delivered</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-bold text-mcaforo-orange">30+</div>
              <div className="text-sm text-gray-400">Happy Clients</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo.png" alt="McAforo" width={60} height={60} />
          </div>

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

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-gray-600">
              Sign in to access your client portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange focus:ring-mcaforo-orange"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-mcaforo-orange hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange focus:ring-mcaforo-orange"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange hover:opacity-90 text-white font-semibold text-base" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-mcaforo-orange font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mcaforo-orange" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
