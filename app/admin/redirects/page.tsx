'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'

interface Redirect {
  id: string
  source: string
  destination: string
  statusCode: 301 | 302
  isActive: boolean
  createdAt: string
}

export default function RedirectsAdminPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Redirect[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ source: '', destination: '', statusCode: 301 as 301 | 302 })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/redirects')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items ?? [])
    } catch (err) {
      toast({ title: 'Load failed', description: String(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.source.startsWith('/')) {
      toast({ title: 'Source must start with /', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setForm({ source: '', destination: '', statusCode: 301 })
      toast({ title: 'Redirect created' })
      load()
    } catch (err) {
      toast({
        title: 'Create failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  async function toggle(r: Redirect) {
    const res = await fetch(`/api/admin/redirects/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    })
    if (res.ok) load()
  }

  async function del(id: string) {
    if (!window.confirm('Delete this redirect?')) return
    const res = await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Deleted' }); load() }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Redirects</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} redirect(s). Changes take effect within 60s across all instances.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Source (path)</label>
              <Input
                placeholder="/old-path"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Destination (URL or path)</label>
              <Input
                placeholder="/new-path or https://example.com/x"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Code</label>
              <select
                value={form.statusCode}
                onChange={(e) => setForm({ ...form, statusCode: Number(e.target.value) as 301 | 302 })}
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={301}>301 permanent</option>
                <option value={302}>302 temporary</option>
              </select>
            </div>
            <Button onClick={create} disabled={creating || !form.source || !form.destination}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.source}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                      {r.destination}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.statusCode === 301 ? 'default' : 'secondary'}>
                        {r.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => toggle(r)}>
                        {r.isActive ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-muted-foreground">off</span>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No redirects yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
