'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Repeat, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

interface RecurringInvoice {
  id: string
  name: string
  description: string | null
  cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  startDate: string
  endDate: string | null
  nextIssueDate: string
  lastIssuedAt: string | null
  dueDays: number
  isActive: boolean
  subtotal: string
  total: string
  currency: string
  company: { id: string; name: string }
  _count: { invoices: number }
}

interface Company {
  id: string
  name: string
}

const emptyForm = {
  companyId: '',
  name: '',
  description: '',
  cycle: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  startDate: '',
  endDate: '',
  nextIssueDate: '',
  dueDays: 14,
  isActive: true,
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  currency: 'GHS',
  lateFeePercent: 0,
}

export default function RecurringInvoicesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<RecurringInvoice[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ open: boolean; editId?: string }>({ open: false })
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    const [rRes, cRes] = await Promise.all([
      fetch('/api/admin/recurring-invoices'),
      fetch('/api/admin/companies'),
    ])
    if (rRes.ok) setItems((await rRes.json()).recurring || [])
    if (cRes.ok) {
      const data = await cRes.json()
      setCompanies(data.companies || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    const today = new Date().toISOString().split('T')[0]
    setForm({ ...emptyForm, startDate: today, nextIssueDate: today })
    setDialog({ open: true })
  }

  const save = async () => {
    const isEdit = !!dialog.editId
    const url = isEdit ? `/api/admin/recurring-invoices/${dialog.editId}` : '/api/admin/recurring-invoices'
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast({ title: isEdit ? 'Updated' : 'Created' })
      setDialog({ open: false })
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Error', description: err.error || 'Failed', variant: 'destructive' })
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this recurring invoice?')) return
    const res = await fetch(`/api/admin/recurring-invoices/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Deleted' }); load() }
  }

  const toggle = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/recurring-invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) load()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Repeat className="h-7 w-7" />Recurring Invoices</h1>
          <p className="text-muted-foreground mt-1">Automatically generate invoices on a schedule</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Recurring Invoice</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Next Issue</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.company.name}</TableCell>
                  <TableCell><Badge variant="outline">{r.cycle}</Badge></TableCell>
                  <TableCell className="text-sm"><Calendar className="inline h-3 w-3 mr-1" />{new Date(r.nextIssueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{r.currency} {Number(r.total).toLocaleString()}</TableCell>
                  <TableCell>{r._count.invoices}</TableCell>
                  <TableCell>
                    <Switch checked={r.isActive} onCheckedChange={() => toggle(r.id, r.isActive)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No recurring invoices yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ ...dialog, open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog.editId ? 'Edit' : 'New'} Recurring Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly hosting" /></div>
              <div className="space-y-2"><Label>Company</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Billing Cycle</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' })}>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Due Days (after issue)</Label><Input type="number" value={form.dueDays} onChange={(e) => setForm({ ...form, dueDays: parseInt(e.target.value) || 14 })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Next Issue</Label><Input type="date" value={form.nextIssueDate} onChange={(e) => setForm({ ...form, nextIssueDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date (optional)</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Subtotal</Label><Input type="number" step="0.01" value={form.subtotal} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setForm({ ...form, subtotal: v, total: v + form.tax - form.discount }) }} /></div>
              <div className="space-y-2"><Label>Tax</Label><Input type="number" step="0.01" value={form.tax} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setForm({ ...form, tax: v, total: form.subtotal + v - form.discount }) }} /></div>
              <div className="space-y-2"><Label>Discount</Label><Input type="number" step="0.01" value={form.discount} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setForm({ ...form, discount: v, total: form.subtotal + form.tax - v }) }} /></div>
              <div className="space-y-2"><Label>Total</Label><Input type="number" step="0.01" value={form.total} onChange={(e) => setForm({ ...form, total: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
              <div className="space-y-2"><Label>Late Fee % (optional)</Label><Input type="number" step="0.01" value={form.lateFeePercent} onChange={(e) => setForm({ ...form, lateFeePercent: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
              <Label>Active (auto-issue invoices)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={save} disabled={!form.name || !form.companyId || !form.startDate || form.total <= 0}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
