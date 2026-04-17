'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
        
        if (pendingSubscriptionId) {
          router.push(`/portal/billing?subscriptionId=${pendingSubscriptionId}`)
          return
        }
        
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
    <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 lg:p-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
              <Image src="/logo.png" alt="McAforo" width={32} height={32} />
              <span className="font-semibold text-gray-800">McAforo</span>
            </div>
          </Link>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Success/Error Messages */}
          {message === 'verified' && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email verified! {pendingSubscriptionId ? 'Sign in to complete your subscription.' : 'You can now sign in.'}
              </AlertDescription>
            </Alert>
          )}
          {message === 'already-verified' && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Your email is already verified.</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error === 'invalid-token' && 'Invalid or expired verification link.'}
                {error === 'missing-token' && 'Verification token is missing.'}
                {error === 'server-error' && 'An error occurred. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to access your client portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-12 bg-white/80 border-gray-200 rounded-xl focus:border-mcaforo-orange focus:ring-mcaforo-orange/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                <Link href="/forgot-password" className="text-sm text-mcaforo-orange hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="h-12 bg-white/80 border-gray-200 rounded-xl pr-12 focus:border-mcaforo-orange focus:ring-mcaforo-orange/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-mcaforo-orange hover:bg-mcaforo-orange/90 text-white font-semibold rounded-xl shadow-lg shadow-orange-200/50" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-between text-sm text-gray-600"
        >
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-mcaforo-orange font-semibold hover:underline">
              Sign up
            </Link>
          </span>
          <Link href="/terms" className="hover:underline">Terms & Conditions</Link>
        </motion.div>
      </div>

      {/* Right Side - Image with floating elements */}
      <div className="hidden lg:block lg:w-[55%] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative h-full w-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800"
        >
          {/* Background Image */}
          <Image
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
            alt="Team collaboration"
            fill
            className="object-cover opacity-80"
            priority
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Floating UI Elements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-8 right-8 bg-white rounded-xl p-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Project Update</p>
                <p className="text-xs text-gray-500">Website launch completed</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute bottom-32 left-8 bg-white rounded-xl p-4 shadow-xl"
          >
            <p className="font-semibold text-gray-900 text-sm mb-2">Active Projects</p>
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-mcaforo-orange flex items-center justify-center text-white text-xs font-bold">JD</div>
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">AK</div>
              <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">MN</div>
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">+5</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-mcaforo-orange to-amber-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">98% Client Satisfaction</p>
                <p className="text-xs text-gray-500">Based on 50+ projects</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-8 w-8 animate-spin text-mcaforo-orange" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
