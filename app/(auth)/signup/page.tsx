'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Building2, Check, User, Mail, Lock, Phone, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string
  plans: Plan[]
}

interface Plan {
  id: string
  name: string
  description: string | null
  priceMin: number
  priceMax: number
  features: string[]
  billingCycle: string | null
}

function SignupForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check for pre-selected plan from URL
  useEffect(() => {
    const planId = searchParams.get('planId')
    if (planId) {
      setSelectedPlanId(planId)
    }
  }, [searchParams])

  // Fetch available services and plans
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services')
        if (res.ok) {
          const data = await res.json()
          setServices(data.services || [])
        }
      } catch (error) {
        console.error('Failed to fetch services:', error)
      }
    }
    fetchServices()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match',
        variant: 'destructive',
      })
      return
    }

    if (!formData.companyName.trim()) {
      toast({
        title: 'Company name required',
        description: 'Please enter your company or business name',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          phone: formData.phone || null,
          selectedPlanId: selectedPlanId,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        })
        router.push('/login?registered=true')
      } else {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create account')
      }
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlan = services
    .flatMap(s => s.plans)
    .find(p => p.id === selectedPlanId)

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
            <h1 className="text-4xl font-bold mb-4">Join McAforo</h1>
            <p className="text-xl text-gray-300 max-w-md">
              Start your digital transformation journey with us today.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 space-y-4 w-full max-w-sm"
          >
            {[
              'Access to client portal',
              'Track your projects in real-time',
              'Manage invoices & payments',
              'Direct support communication',
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                <div className="h-8 w-8 rounded-full bg-mcaforo-orange/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-mcaforo-orange" />
                </div>
                <span className="text-sm text-gray-300">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-6"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Image src="/logo.png" alt="McAforo" width={60} height={60} />
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
            <p className="mt-2 text-gray-600">
              {step === 1 ? 'Tell us about yourself and your company' : 'Choose a service plan (optional)'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
              step >= 1 ? "bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange text-white" : "bg-gray-100 text-gray-400"
            )}>
              {step > 1 ? <Check className="h-5 w-5" /> : '1'}
            </div>
            <div className={cn("h-1 w-16 rounded-full transition-all", step >= 2 ? "bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange" : "bg-gray-200")} />
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
              step >= 2 ? "bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange text-white" : "bg-gray-100 text-gray-400"
            )}>
              2
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      required
                      autoComplete="given-name"
                      className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      required
                      autoComplete="family-name"
                      className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700 font-medium">Company / Business Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Your Company Ltd"
                    required
                    className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+233 20 000 0000"
                    autoComplete="tel"
                    className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      className="pl-10 h-12 border-gray-200 focus:border-mcaforo-orange"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange hover:opacity-90 text-white font-semibold">
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Selected Plan Summary */}
              {selectedPlan && (
                <Card className="border-mcaforo-orange bg-mcaforo-orange/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-mcaforo-orange" />
                      Selected Plan: {selectedPlan.name}
                    </CardTitle>
                    <CardDescription>
                      GHS {Number(selectedPlan.priceMin).toLocaleString()}
                      {selectedPlan.billingCycle && ` / ${selectedPlan.billingCycle.toLowerCase()}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* Service Plans */}
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id}>
                    <h3 className="font-semibold mb-2 text-gray-800">{service.name}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {service.plans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-mcaforo-orange hover:shadow-md",
                            selectedPlanId === plan.id && "border-mcaforo-orange bg-mcaforo-orange/5"
                          )}
                          onClick={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{plan.name}</CardTitle>
                              {selectedPlanId === plan.id && (
                                <Check className="h-5 w-5 text-mcaforo-orange" />
                              )}
                            </div>
                            <CardDescription>
                              GHS {Number(plan.priceMin).toLocaleString()}
                              {plan.billingCycle && ` / ${plan.billingCycle.toLowerCase()}`}
                            </CardDescription>
                          </CardHeader>
                          {plan.features.length > 0 && (
                            <CardContent className="pt-0">
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {plan.features.slice(0, 3).map((feature, i) => (
                                  <li key={i}>• {feature}</li>
                                ))}
                              </ul>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {services.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Sparkles className="h-8 w-8 text-mcaforo-orange mx-auto mb-2" />
                  <p className="text-gray-600">
                    No service plans available. You can subscribe later from your portal.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-gray-300">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading} 
                  className="flex-1 h-12 bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange hover:opacity-90 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : selectedPlanId ? (
                    <>
                      Create & Pay
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-mcaforo-orange hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-mcaforo-orange hover:underline">
              Privacy Policy
            </Link>
          </p>

          <div className="text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-mcaforo-orange font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mcaforo-orange" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
