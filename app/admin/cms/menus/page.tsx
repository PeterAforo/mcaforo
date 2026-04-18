'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

interface MenuItem {
  id: string
  label: string
  url: string
  order: number
  isActive: boolean
  target: string
  children: MenuItem[]
}

interface Menu {
  id: string
  name: string
  location: string
  isActive: boolean
  items: MenuItem[]
}

export default function MenusPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [newMenu, setNewMenu] = useState({ name: '', location: '' })
  const [itemDialog, setItemDialog] = useState<{ open: boolean; menuId: string; editId?: string }>({ open: false, menuId: '' })
  const [itemForm, setItemForm] = useState({ label: '', url: '', order: 0, target: '_self', isActive: true })

  const load = async () => {
    const res = await fetch('/api/admin/cms/menus')
    if (res.ok) {
      const data = await res.json()
      setMenus(data.menus || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createMenu = async () => {
    const res = await fetch('/api/admin/cms/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMenu),
    })
    if (res.ok) {
      setShowNewMenu(false)
      setNewMenu({ name: '', location: '' })
      toast({ title: 'Menu created' })
      load()
    } else {
      toast({ title: 'Error', description: 'Failed to create menu', variant: 'destructive' })
    }
  }

  const deleteMenu = async (id: string) => {
    if (!confirm('Delete this menu and all its items?')) return
    const res = await fetch(`/api/admin/cms/menus/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Menu deleted' }); load() }
  }

  const saveItem = async () => {
    const isEdit = !!itemDialog.editId
    const url = isEdit ? `/api/admin/cms/menu-items/${itemDialog.editId}` : '/api/admin/cms/menu-items'
    const method = isEdit ? 'PATCH' : 'POST'
    const body = isEdit ? itemForm : { ...itemForm, menuId: itemDialog.menuId }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setItemDialog({ open: false, menuId: '' })
      setItemForm({ label: '', url: '', order: 0, target: '_self', isActive: true })
      toast({ title: isEdit ? 'Item updated' : 'Item added' })
      load()
    }
  }

  const editItem = (menuId: string, item: MenuItem) => {
    setItemForm({ label: item.label, url: item.url, order: item.order, target: item.target, isActive: item.isActive })
    setItemDialog({ open: true, menuId, editId: item.id })
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return
    const res = await fetch(`/api/admin/cms/menu-items/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Item deleted' }); load() }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Navigation Menus</h1>
          <p className="text-muted-foreground mt-1">Manage header, footer and custom menus</p>
        </div>
        <Dialog open={showNewMenu} onOpenChange={setShowNewMenu}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Menu</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Menu</DialogTitle>
              <DialogDescription>Create a new navigation menu</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} placeholder="e.g. Footer Menu" />
              </div>
              <div className="space-y-2">
                <Label>Location (unique key)</Label>
                <Input value={newMenu.location} onChange={(e) => setNewMenu({ ...newMenu, location: e.target.value })} placeholder="e.g. footer, sidebar" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewMenu(false)}>Cancel</Button>
              <Button onClick={createMenu} disabled={!newMenu.name || !newMenu.location}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {menus.map((menu) => (
          <Card key={menu.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {menu.name}
                    <Badge variant={menu.isActive ? 'default' : 'secondary'}>{menu.isActive ? 'Active' : 'Inactive'}</Badge>
                  </CardTitle>
                  <CardDescription>Location: <code className="text-xs bg-muted px-1 rounded">{menu.location}</code></CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setItemForm({ label: '', url: '', order: menu.items.length, target: '_self', isActive: true }); setItemDialog({ open: true, menuId: menu.id }) }}>
                    <Plus className="mr-2 h-4 w-4" />Add Item
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMenu(menu.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {menu.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet. Click "Add Item" to add one.</p>
              ) : (
                <div className="space-y-2">
                  {menu.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.url}</p>
                      </div>
                      {!item.isActive && <Badge variant="secondary">Hidden</Badge>}
                      <Button size="sm" variant="ghost" onClick={() => editItem(menu.id, item)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={itemDialog.open} onOpenChange={(o) => setItemDialog({ ...itemDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemDialog.editId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Label</Label><Input value={itemForm.label} onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })} /></div>
            <div className="space-y-2"><Label>URL</Label><Input value={itemForm.url} onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })} placeholder="/about or https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={itemForm.order} onChange={(e) => setItemForm({ ...itemForm, order: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Target</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={itemForm.target} onChange={(e) => setItemForm({ ...itemForm, target: e.target.value })}>
                  <option value="_self">Same tab</option>
                  <option value="_blank">New tab</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={itemForm.isActive} onCheckedChange={(c) => setItemForm({ ...itemForm, isActive: c })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog({ open: false, menuId: '' })}>Cancel</Button>
            <Button onClick={saveItem} disabled={!itemForm.label || !itemForm.url}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
