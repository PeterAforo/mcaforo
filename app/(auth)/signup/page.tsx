'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Building2, Check } from 'lucide-react'

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
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-2 text-muted-foreground">
          {step === 1 ? 'Tell us about yourself and your company' : 'Choose a service plan (optional)'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
          step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          1
        </div>
        <div className={cn("h-1 w-12", step >= 2 ? "bg-primary" : "bg-muted")} />
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
          step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          2
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company / Business Name *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Your Company Ltd"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+233 20 000 0000"
              autoComplete="tel"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Selected Plan Summary */}
          {selectedPlan && (
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
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
                <h3 className="font-semibold mb-2">{service.name}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {service.plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        selectedPlanId === plan.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          {selectedPlanId === plan.id && (
                            <Check className="h-5 w-5 text-primary" />
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
            <p className="text-center text-muted-foreground py-8">
              No service plans available. You can subscribe later from your portal.
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : selectedPlanId ? (
                'Create Account & Continue to Payment'
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
