'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface CMSPage {
  id: string
  slug: string
  title: string
  excerpt: string | null
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  updatedAt: string
}

const emptyForm = { slug: '', title: '', excerpt: '', content: '', metaTitle: '', metaDescription: '', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' }

export default function CMSPagesPage() {
  const { toast } = useToast()
  const [pages, setPages] = useState<CMSPage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ open: boolean; editId?: string }>({ open: false })
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    const res = await fetch('/api/admin/cms/pages')
    if (res.ok) {
      const data = await res.json()
      setPages(data.pages || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setDialog({ open: true }) }
  const openEdit = (id: string) => {
    // New block-based editor. List stays for create/delete; edit navigates.
    window.location.href = `/admin/cms/pages/${id}`
  }

  const save = async () => {
    const isEdit = !!dialog.editId
    const url = isEdit ? `/api/admin/cms/pages/${dialog.editId}` : '/api/admin/cms/pages'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast({ title: isEdit ? 'Page updated' : 'Page created' })
      setDialog({ open: false })
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Error', description: err.error || 'Failed to save', variant: 'destructive' })
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this page?')) return
    const res = await fetch(`/api/admin/cms/pages/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Page deleted' }); load() }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground mt-1">Manage website pages and content</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Page</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1 rounded">/{p.slug}</code></TableCell>
                  <TableCell><Badge variant={p.status === 'PUBLISHED' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/${p.slug}`} target="_blank"><Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></Link>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {pages.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pages yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ ...dialog, open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog.editId ? 'Edit Page' : 'New Page'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="about-us" /></div>
            </div>
            <div className="space-y-2"><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div className="space-y-2"><Label>Content (HTML)</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Meta Description</Label><Textarea rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={save} disabled={!form.title || !form.slug}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
