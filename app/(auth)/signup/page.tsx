'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Building2, Check, Eye, EyeOff, Sparkles } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="h-screen flex bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-6 lg:p-8">
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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
            <p className="text-gray-600 text-sm">
              {step === 1 ? 'Sign up and get started today' : 'Choose a service plan (optional)'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-gray-700 text-xs">Full name</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name"
                    required
                    autoComplete="given-name"
                    className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm focus:border-mcaforo-orange"
                  />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                    required
                    autoComplete="family-name"
                    className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm focus:border-mcaforo-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-gray-700 text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm focus:border-mcaforo-orange"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-gray-700 text-xs">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+233 20 000 0000"
                    autoComplete="tel"
                    className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm focus:border-mcaforo-orange"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="companyName" className="text-gray-700 text-xs">Company / Business Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Ltd"
                  required
                  className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm focus:border-mcaforo-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-gray-700 text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm pr-10 focus:border-mcaforo-orange"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-gray-700 text-xs">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="h-10 bg-white/80 border-gray-200 rounded-lg text-sm focus:border-mcaforo-orange"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 bg-mcaforo-orange hover:bg-mcaforo-orange/90 text-white font-semibold rounded-lg shadow-lg shadow-orange-200/50"
              >
                Continue
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {selectedPlan && (
                <Card className="border-mcaforo-orange bg-mcaforo-orange/5">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-mcaforo-orange" />
                      Selected: {selectedPlan.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      GHS {Number(selectedPlan.priceMin).toLocaleString()}
                      {selectedPlan.billingCycle && ` / ${selectedPlan.billingCycle.toLowerCase()}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {services.map((service) => (
                  <div key={service.id}>
                    <h3 className="font-semibold mb-1 text-gray-800 text-xs">{service.name}</h3>
                    <div className="grid gap-1">
                      {service.plans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-mcaforo-orange",
                            selectedPlanId === plan.id && "border-mcaforo-orange bg-mcaforo-orange/5"
                          )}
                          onClick={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)}
                        >
                          <CardHeader className="py-2 px-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-xs">{plan.name}</CardTitle>
                                <CardDescription className="text-xs">
                                  GHS {Number(plan.priceMin).toLocaleString()}
                                </CardDescription>
                              </div>
                              {selectedPlanId === plan.id && (
                                <Check className="h-4 w-4 text-mcaforo-orange" />
                              )}
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {services.length === 0 && (
                <div className="text-center py-4 bg-white/50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-mcaforo-orange mx-auto mb-1" />
                  <p className="text-gray-600 text-xs">
                    No plans available. Subscribe later from your portal.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 border-gray-300 rounded-lg text-sm">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading} 
                  className="flex-1 h-10 bg-mcaforo-orange hover:bg-mcaforo-orange/90 text-white font-semibold rounded-lg shadow-lg shadow-orange-200/50 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-between text-xs text-gray-600"
        >
          <span>
            Already have an account?{' '}
            <Link href="/login" className="text-mcaforo-orange font-semibold hover:underline">
              Sign in
            </Link>
          </span>
          <Link href="/terms" className="hover:underline">Terms & Conditions</Link>
        </motion.div>
      </div>

      {/* Right Side - Image with floating elements */}
      <div className="hidden lg:block lg:w-[55%] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative h-full w-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800"
        >
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
            alt="Team working together"
            fill
            className="object-cover opacity-80"
            priority
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Floating UI Elements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-mcaforo-orange to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs">Welcome to McAforo</p>
                <p className="text-[10px] text-gray-500">Your digital partner</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute top-4 right-4 bg-white rounded-lg p-2 shadow-xl"
          >
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-gray-700">Online Support</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl"
          >
            <p className="font-semibold text-gray-900 mb-2 text-xs">What you&apos;ll get:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Client Portal Access', 'Project Tracking', 'Invoice Management', '24/7 Support'].map((feature) => (
                <div key={feature} className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-mcaforo-orange/20 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-mcaforo-orange" />
                  </div>
                  <span className="text-[10px] text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-8 w-8 animate-spin text-mcaforo-orange" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
