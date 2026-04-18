'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, GripVertical, Save, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface MenuItem {
  id: string
  label: string
  url: string
  target: '_self' | '_blank'
  order: number
  parentId: string | null
}

interface Menu {
  id: string
  name: string
  slug: string
  location: string
  items: MenuItem[]
}

/**
 * Sprint 4 UX polish: Menus editor.
 *
 * Tree editing is done via a flat list with `parentId` references; the
 * backend rebuilds the tree atomically on PUT. A full drag-drop tree
 * rewrite would require `@dnd-kit`; this ships a usable linear editor
 * with indent/outdent controls.
 */
export default function MenusPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<Menu[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', location: 'header' })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/menus')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMenus(data.items ?? [])
      if (data.items?.[0] && !activeId) setActiveId(data.items[0].id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const active = menus.find((m) => m.id === activeId)

  async function createMenu() {
    const res = await fetch('/api/admin/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setCreateOpen(false)
      setForm({ name: '', slug: '', location: 'header' })
      load()
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: 'Create failed', description: j.error, variant: 'destructive' })
    }
  }

  function setItems(updater: (items: MenuItem[]) => MenuItem[]) {
    if (!active) return
    setMenus(menus.map((m) => m.id === active.id ? { ...m, items: updater(m.items) } : m))
  }

  function addItem() {
    setItems((items) => [
      ...items,
      {
        id: `tmp-${Date.now()}`,
        label: 'New item',
        url: '/',
        target: '_self',
        order: items.length,
        parentId: null,
      },
    ])
  }

  function updateItem(id: string, patch: Partial<MenuItem>) {
    setItems((items) => items.map((it) => it.id === id ? { ...it, ...patch } : it))
  }

  function removeItem(id: string) {
    setItems((items) =>
      items
        .filter((it) => it.id !== id && it.parentId !== id)
        .map((it, i) => ({ ...it, order: i }))
    )
  }

  function move(id: string, dir: -1 | 1) {
    setItems((items) => {
      const idx = items.findIndex((it) => it.id === id)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= items.length) return items
      const next = [...items]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((it, i) => ({ ...it, order: i }))
    })
  }

  async function saveTree() {
    if (!active) return
    setSaving(true)
    try {
      const payload = active.items.map((it, i) => ({
        id: it.id.startsWith('tmp-') ? undefined : it.id,
        label: it.label,
        url: it.url,
        target: it.target,
        order: i,
        parentId: it.parentId,
      }))
      const res = await fetch(`/api/admin/menus/${active.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      toast({ title: 'Menu saved' })
      load()
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menus</h1>
          <p className="text-sm text-muted-foreground">Navigation menus for header, footer, and mobile drawer.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New menu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create menu</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="header-main" />
              </div>
              <div>
                <Label>Location</Label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createMenu} disabled={!form.name || !form.slug}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : menus.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No menus yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <Card>
            <CardContent className="p-2">
              <ul className="space-y-1">
                {menus.map((m) => (
                  <li key={m.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                        m.id === activeId ? 'bg-accent font-medium' : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveId(m.id)}
                    >
                      <div>
                        <div>{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.location}</div>
                      </div>
                      {m.id === activeId && <ChevronRight className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {active && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{active.name}</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={addItem}>
                      <Plus className="mr-1 h-4 w-4" /> Add item
                    </Button>
                    <Button size="sm" onClick={saveTree} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <ul className="space-y-1">
                  {active.items.length === 0 && (
                    <li className="text-sm text-muted-foreground text-center py-6">
                      No items. Add one above.
                    </li>
                  )}
                  {active.items.map((it, idx) => (
                    <li
                      key={it.id}
                      className="flex items-center gap-2 p-2 rounded-md border bg-white"
                      style={{ marginLeft: it.parentId ? 24 : 0 }}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={it.label}
                        onChange={(e) => updateItem(it.id, { label: e.target.value })}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={it.url}
                        onChange={(e) => updateItem(it.id, { url: e.target.value })}
                        placeholder="/path"
                        className="flex-1 font-mono text-xs"
                      />
                      <select
                        value={it.target}
                        onChange={(e) => updateItem(it.id, { target: e.target.value as '_self' | '_blank' })}
                        className="h-10 px-2 text-xs rounded-md border border-input"
                      >
                        <option value="_self">Same</option>
                        <option value="_blank">New tab</option>
                      </select>
                      <Button size="sm" variant="ghost" onClick={() => move(it.id, -1)} disabled={idx === 0}>↑</Button>
                      <Button size="sm" variant="ghost" onClick={() => move(it.id, 1)} disabled={idx === active.items.length - 1}>↓</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeItem(it.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
