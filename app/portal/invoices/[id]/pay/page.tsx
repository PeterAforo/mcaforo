'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Shield, Loader2, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const invoices: Record<string, {
  id: string
  description: string
  amount: number
  currency: string
  status: string
  dueDate: string
}> = {
  'INV-2024-003': {
    id: 'INV-2024-003',
    description: 'E-commerce Website - Phase 2',
    amount: 15000,
    currency: 'GHS',
    status: 'pending',
    dueDate: '2024-02-28',
  },
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
  }).format(amount)
}

export default function PayInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const invoiceId = params.id as string
  const invoice = invoices[invoiceId]

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!invoice || invoice.status !== 'pending') {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invoice Already Paid</h2>
            <p className="text-muted-foreground">This invoice has already been paid or doesn&apos;t exist.</p>
            <Button className="mt-4" asChild>
              <Link href="/portal/invoices">View All Invoices</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amount,
          currency: invoice.currency,
          paymentMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          toast({
            title: 'Payment Initiated',
            description: 'Redirecting to payment gateway...',
          })
        }
      } else {
        throw new Error('Failed to initialize payment')
      }
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/portal/invoices/${invoice.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pay Invoice</h1>
          <p className="text-muted-foreground">{invoice.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how you&apos;d like to pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  paymentMethod === 'card' && "border-primary bg-primary/5"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded-full border-2",
                  paymentMethod === 'card' ? "border-primary bg-primary" : "border-muted-foreground"
                )} />
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Card Payment</p>
                  <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or other cards</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_money')}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  paymentMethod === 'mobile_money' && "border-primary bg-primary/5"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded-full border-2",
                  paymentMethod === 'mobile_money' ? "border-primary bg-primary" : "border-muted-foreground"
                )} />
                <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12" y2="18"/>
                </svg>
                <div>
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">Pay with MTN MoMo, Vodafone Cash, or AirtelTigo</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  paymentMethod === 'bank_transfer' && "border-primary bg-primary/5"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded-full border-2",
                  paymentMethod === 'bank_transfer' ? "border-primary bg-primary" : "border-muted-foreground"
                )} />
                <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                </svg>
                <div>
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-sm text-muted-foreground">Direct bank transfer</p>
                </div>
              </button>
            </CardContent>
          </Card>

          {paymentMethod === 'mobile_money' && (
            <Card>
              <CardHeader>
                <CardTitle>Mobile Money Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="0XX XXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <select id="network" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="vodafone">Vodafone Cash</option>
                    <option value="airteltigo">AirtelTigo Money</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your payment is secured with 256-bit SSL encryption</span>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{invoice.description}</p>
                <p className="text-sm text-muted-foreground">Invoice: {invoice.id}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span>{formatCurrency(0, invoice.currency)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay {formatCurrency(invoice.amount, invoice.currency)}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Due by {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
