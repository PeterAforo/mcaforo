'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit, ExternalLink, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  author: string
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  updatedAt: string
  category?: { id: string; name: string } | null
  categoryId?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  _count: { posts: number }
}

const emptyPost = { slug: '', title: '', excerpt: '', content: '', author: 'McAforo Team', categoryId: '', tags: '', featuredImage: '', metaTitle: '', metaDescription: '', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' }

export default function BlogAdminPage() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [postDialog, setPostDialog] = useState<{ open: boolean; editId?: string }>({ open: false })
  const [postForm, setPostForm] = useState(emptyPost)
  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '' })

  const load = async () => {
    const [postsRes, catsRes] = await Promise.all([
      fetch('/api/admin/blog'),
      fetch('/api/admin/blog/categories'),
    ])
    if (postsRes.ok) setPosts((await postsRes.json()).posts || [])
    if (catsRes.ok) setCategories((await catsRes.json()).categories || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNewPost = () => { setPostForm(emptyPost); setPostDialog({ open: true }) }
  const openEditPost = async (id: string) => {
    const res = await fetch(`/api/admin/blog/${id}`)
    if (res.ok) {
      const data = await res.json()
      const p = data.post
      setPostForm({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || '',
        content: p.content || '',
        author: p.author || 'McAforo Team',
        categoryId: p.categoryId || '',
        tags: (p.tags || []).join(', '),
        featuredImage: p.featuredImage || '',
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        status: p.status,
      })
      setPostDialog({ open: true, editId: id })
    }
  }

  const savePost = async () => {
    const isEdit = !!postDialog.editId
    const url = isEdit ? `/api/admin/blog/${postDialog.editId}` : '/api/admin/blog'
    const body = {
      ...postForm,
      tags: postForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      categoryId: postForm.categoryId || null,
    }
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast({ title: isEdit ? 'Post updated' : 'Post created' })
      setPostDialog({ open: false })
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Error', description: err.error || 'Failed', variant: 'destructive' })
    }
  }

  const delPost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Post deleted' }); load() }
  }

  const saveCategory = async () => {
    const res = await fetch('/api/admin/blog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catForm),
    })
    if (res.ok) {
      toast({ title: 'Category created' })
      setCatDialog(false)
      setCatForm({ name: '', slug: '', description: '' })
      load()
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="text-muted-foreground mt-1">Manage blog posts and categories</p>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewPost}><Plus className="mr-2 h-4 w-4" />New Post</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground">/{p.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>{p.category?.name || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>{p.author}</TableCell>
                      <TableCell><Badge variant={p.status === 'PUBLISHED' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/blog/${p.slug}`} target="_blank"><Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></Link>
                        <Button size="sm" variant="ghost" onClick={() => openEditPost(p.id)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => delPost(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No blog posts yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCatDialog(true)}><Plus className="mr-2 h-4 w-4" />New Category</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Tag className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c._count.posts} posts</p>
                      {c.description && <p className="text-sm mt-2 text-muted-foreground">{c.description}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Post Dialog */}
      <Dialog open={postDialog.open} onOpenChange={(o) => setPostDialog({ ...postDialog, open: o })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{postDialog.editId ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Excerpt</Label><Textarea rows={2} value={postForm.excerpt} onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })} /></div>
            <div className="space-y-2"><Label>Content (HTML/Markdown)</Label><Textarea rows={12} value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Author</Label><Input value={postForm.author} onChange={(e) => setPostForm({ ...postForm, author: e.target.value })} /></div>
              <div className="space-y-2"><Label>Category</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={postForm.categoryId} onChange={(e) => setPostForm({ ...postForm, categoryId: e.target.value })}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={postForm.tags} onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={postForm.status} onChange={(e) => setPostForm({ ...postForm, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Featured Image URL</Label><Input value={postForm.featuredImage} onChange={(e) => setPostForm({ ...postForm, featuredImage: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostDialog({ open: false })}>Cancel</Button>
            <Button onClick={savePost} disabled={!postForm.title || !postForm.slug}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={!catForm.name || !catForm.slug}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
