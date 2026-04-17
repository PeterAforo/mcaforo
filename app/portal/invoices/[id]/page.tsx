'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, CreditCard, Calendar, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const invoices: Record<string, {
  id: string
  description: string
  amount: number
  currency: string
  status: string
  dueDate: string
  issuedDate: string
  paidDate?: string
  items: { description: string; quantity: number; unitPrice: number }[]
  company: { name: string; address: string; email: string }
}> = {
  'INV-2024-003': {
    id: 'INV-2024-003',
    description: 'E-commerce Website - Phase 2',
    amount: 15000,
    currency: 'GHS',
    status: 'pending',
    dueDate: '2024-02-28',
    issuedDate: '2024-02-14',
    items: [
      { description: 'Frontend Development', quantity: 1, unitPrice: 8000 },
      { description: 'Backend Integration', quantity: 1, unitPrice: 5000 },
      { description: 'Testing & QA', quantity: 1, unitPrice: 2000 },
    ],
    company: { name: 'Sample Company Ltd', address: 'Accra, Ghana', email: 'info@samplecompany.com' },
  },
  'INV-2024-002': {
    id: 'INV-2024-002',
    description: 'CRM Integration - Initial Payment',
    amount: 8000,
    currency: 'GHS',
    status: 'paid',
    dueDate: '2024-02-15',
    issuedDate: '2024-02-01',
    paidDate: '2024-02-10',
    items: [
      { description: 'CRM Setup & Configuration', quantity: 1, unitPrice: 5000 },
      { description: 'Data Migration', quantity: 1, unitPrice: 3000 },
    ],
    company: { name: 'Sample Company Ltd', address: 'Accra, Ghana', email: 'info@samplecompany.com' },
  },
  'INV-2024-001': {
    id: 'INV-2024-001',
    description: 'E-commerce Website - Phase 1',
    amount: 12000,
    currency: 'GHS',
    status: 'paid',
    dueDate: '2024-01-31',
    issuedDate: '2024-01-15',
    paidDate: '2024-01-28',
    items: [
      { description: 'UI/UX Design', quantity: 1, unitPrice: 4000 },
      { description: 'Frontend Development', quantity: 1, unitPrice: 6000 },
      { description: 'Project Setup', quantity: 1, unitPrice: 2000 },
    ],
    company: { name: 'Sample Company Ltd', address: 'Accra, Ghana', email: 'info@samplecompany.com' },
  },
}

const statusColors = {
  pending: 'destructive',
  paid: 'default',
  overdue: 'destructive',
} as const

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
  }).format(amount)
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const invoice = invoices[invoiceId]

  if (!invoice) {
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
            <p className="text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.id}</h1>
            <p className="text-muted-foreground">{invoice.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {invoice.status === 'pending' && (
            <Button size="sm" asChild>
              <Link href={`/portal/invoices/${invoice.id}/pay`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details</CardTitle>
              <Badge variant={statusColors[invoice.status as keyof typeof statusColors]}>
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{new Date(invoice.issuedDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4">Line Items</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={3} className="pt-4 text-right">Total</td>
                    <td className="pt-4 text-right text-lg">{formatCurrency(invoice.amount, invoice.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{invoice.company.name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.company.address}</p>
                  <p className="text-sm text-muted-foreground">{invoice.company.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (0%)</span>
                <span>{formatCurrency(0, invoice.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Due</span>
                <span className="text-lg">{formatCurrency(invoice.amount, invoice.currency)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
