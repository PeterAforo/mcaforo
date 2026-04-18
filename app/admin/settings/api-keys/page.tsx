'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  rateLimit: number
  expiresAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

const AVAILABLE_SCOPES = ['content.read', 'content.write', '*']

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    scopes: ['content.read'] as string[],
    rateLimit: 60,
  })
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-keys')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function create() {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setNewKey(data.key.plain)
      setForm({ name: '', scopes: ['content.read'], rateLimit: 60 })
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

  async function copyKey() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeNewKey() {
    setNewKey(null)
    setOpen(false)
  }

  function toggleScope(s: string) {
    if (form.scopes.includes(s)) {
      setForm({ ...form, scopes: form.scopes.filter((x) => x !== s) })
    } else {
      setForm({ ...form, scopes: [...form.scopes, s] })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API keys</h1>
          <p className="text-sm text-muted-foreground">
            Used to authenticate requests to the public <code>/api/v1</code> endpoints.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setNewKey(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Your new API key</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Copy this now.</strong> You won't be able to see it again.
                  </p>
                  <div className="flex gap-2">
                    <Input value={newKey} readOnly className="font-mono text-xs" />
                    <Button variant="outline" onClick={copyKey}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={closeNewKey}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="My integration"
                    />
                  </div>
                  <div>
                    <Label>Scopes</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {AVAILABLE_SCOPES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleScope(s)}
                          className={`px-3 py-1 rounded-full text-xs border ${
                            form.scopes.includes(s)
                              ? 'bg-mcaforo-orange text-white border-mcaforo-orange'
                              : 'bg-background text-muted-foreground'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Rate limit (req/min)</Label>
                    <Input
                      type="number"
                      value={form.rateLimit}
                      onChange={(e) => setForm({ ...form, rateLimit: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={create} disabled={creating || !form.name || form.scopes.length === 0}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{k.prefix}…</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{k.rateLimit}/min</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {k.revokedAt ? (
                        <Badge variant="secondary">Revoked</Badge>
                      ) : k.expiresAt && new Date(k.expiresAt) < new Date() ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : (
                        <Badge>Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No API keys</TableCell>
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
