import { Metadata } from 'next'
import Link from 'next/link'
import { Download, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Invoices | McAforo Portal',
  description: 'View and download your invoices',
}

const invoices = [
  {
    id: 'INV-2024-003',
    description: 'E-commerce Website - Phase 2',
    amount: 15000,
    currency: 'GHS',
    status: 'pending',
    dueDate: '2024-02-28',
    issuedDate: '2024-02-14',
  },
  {
    id: 'INV-2024-002',
    description: 'CRM Integration - Initial Payment',
    amount: 8000,
    currency: 'GHS',
    status: 'paid',
    dueDate: '2024-02-15',
    issuedDate: '2024-02-01',
    paidDate: '2024-02-10',
  },
  {
    id: 'INV-2024-001',
    description: 'E-commerce Website - Phase 1',
    amount: 12000,
    currency: 'GHS',
    status: 'paid',
    dueDate: '2024-01-31',
    issuedDate: '2024-01-15',
    paidDate: '2024-01-28',
  },
]

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

export default function InvoicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="mt-1 text-muted-foreground">
          View and download your invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(15000, 'GHS')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(8000, 'GHS')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(20000, 'GHS')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="py-4 font-medium">{invoice.id}</td>
                    <td className="py-4 text-muted-foreground">
                      {invoice.description}
                    </td>
                    <td className="py-4 font-medium">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="py-4">
                      <Badge
                        variant={
                          statusColors[invoice.status as keyof typeof statusColors]
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/portal/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button size="sm" asChild>
                            <Link href={`/portal/invoices/${invoice.id}/pay`}>
                              Pay Now
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
