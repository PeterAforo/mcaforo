'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Download, Edit, Trash2, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  createdAt: string
  company: { id: string; name: string; email: string | null }
  items: InvoiceItem[]
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setInvoice(data.invoice)
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const handleSendInvoice = async () => {
    if (!invoice) return
    setSending(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      if (res.ok) {
        setInvoice({ ...invoice, status: 'SENT' })
        toast({ title: 'Invoice sent successfully' })
      } else {
        throw new Error('Failed to send invoice')
      }
    } catch (error) {
      toast({ title: 'Failed to send invoice', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    setMarkingPaid(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paidAt: new Date().toISOString() }),
      })
      if (res.ok) {
        setInvoice({ ...invoice, status: 'PAID', paidAt: new Date().toISOString() })
        toast({ title: 'Invoice marked as paid' })
      } else {
        throw new Error('Failed to update invoice')
      }
    } catch (error) {
      toast({ title: 'Failed to update invoice', variant: 'destructive' })
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Invoice deleted' })
        router.push('/admin/invoices')
      } else {
        throw new Error('Failed to delete invoice')
      }
    } catch (error) {
      toast({ title: 'Failed to delete invoice', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">{invoice.company.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <Button onClick={handleSendInvoice} disabled={sending}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending...' : 'Send Invoice'}
            </Button>
          )}
          {invoice.status === 'SENT' && (
            <Button onClick={handleMarkPaid} disabled={markingPaid} variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              {markingPaid ? 'Updating...' : 'Mark as Paid'}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the invoice.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details</CardTitle>
              <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.length > 0 ? (
                  invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {invoice.currency} {Number(item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.currency} {Number(item.total).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{invoice.currency} {Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{invoice.currency} {Number(invoice.tax).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{invoice.currency} {Number(invoice.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{invoice.currency} {Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Company</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{invoice.company.name}</p>
              {invoice.company.email && (
                <p className="text-sm text-muted-foreground">{invoice.company.email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>{new Date(invoice.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
