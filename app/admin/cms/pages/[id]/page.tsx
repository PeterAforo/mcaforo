'use client'

import { useCallback, useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, ExternalLink, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  BlockBuilder,
  type BuilderSection,
  type BlockCatalogueEntry,
} from '@/components/admin/BlockBuilder'

interface PageForm {
  slug: string
  title: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  status: 'DRAFT' | 'PUBLISHED'
}

interface SectionRow {
  id: string
  blockType: string | null
  data: unknown
  isActive: boolean
  order: number
}

const emptyForm: PageForm = {
  slug: '',
  title: '',
  excerpt: '',
  metaTitle: '',
  metaDescription: '',
  status: 'DRAFT',
}

export default function EditPagePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(props.params)
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState<PageForm>(emptyForm)
  const [sections, setSections] = useState<BuilderSection[]>([])
  const [catalogue, setCatalogue] = useState<BlockCatalogueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pageRes, sectionsRes, catRes] = await Promise.all([
        fetch(`/api/admin/cms/pages/${id}`),
        fetch(`/api/admin/cms/pages/${id}/sections`),
        fetch('/api/admin/cms/block-catalogue'),
      ])
      if (!pageRes.ok) throw new Error('Page not found')
      const { page } = await pageRes.json()
      setForm({
        slug: page.slug ?? '',
        title: page.title ?? '',
        excerpt: page.excerpt ?? '',
        metaTitle: page.metaTitle ?? '',
        metaDescription: page.metaDescription ?? '',
        status: page.status ?? 'DRAFT',
      })

      const sectionsJson = sectionsRes.ok ? await sectionsRes.json() : { sections: [] }
      setSections(
        (sectionsJson.sections as SectionRow[])
          .filter((s) => !!s.blockType)
          .map((s, i) => ({
            id: s.id,
            tempId: s.id ?? `tmp_${i}`,
            blockType: s.blockType as string,
            data: s.data,
            isActive: s.isActive,
          }))
      )

      if (catRes.ok) {
        const { catalogue } = await catRes.json()
        setCatalogue(catalogue)
      }
    } catch (err) {
      toast({
        title: 'Load failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    setSaving(true)
    try {
      // 1. Save page fields
      const pageRes = await fetch(`/api/admin/cms/pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!pageRes.ok) {
        const j = await pageRes.json().catch(() => ({}))
        throw new Error(j.error ?? 'Failed to save page')
      }
      // 2. Save sections
      const sectionsRes = await fetch(
        `/api/admin/cms/pages/${id}/sections`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sections: sections.map((s) => ({
              id: s.id,
              blockType: s.blockType,
              data: s.data,
              isActive: s.isActive,
            })),
          }),
        }
      )
      if (!sectionsRes.ok) {
        const j = await sectionsRes.json().catch(() => ({}))
        throw new Error(
          j.error
            ? `Sections: ${j.error}${
                j.details ? ' — ' + JSON.stringify(j.details) : ''
              }`
            : 'Failed to save sections'
        )
      }
      toast({ title: 'Saved' })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/cms/pages">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Pages
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{form.title || 'Edit page'}</h1>
          <Badge variant={form.status === 'PUBLISHED' ? 'default' : 'secondary'}>
            {form.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/p/${form.slug}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Main: block builder */}
        <div className="space-y-3">
          <BlockBuilder
            sections={sections}
            onChange={setSections}
            catalogue={catalogue}
          />
        </div>

        {/* Sidebar: page meta */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold">Page details</h3>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as 'DRAFT' | 'PUBLISHED',
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold">SEO</h3>
            <div className="space-y-2">
              <Label>
                Meta title{' '}
                <span className="text-xs text-muted-foreground">
                  ({form.metaTitle.length}/60)
                </span>
              </Label>
              <Input
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Meta description{' '}
                <span className="text-xs text-muted-foreground">
                  ({form.metaDescription.length}/160)
                </span>
              </Label>
              <Textarea
                rows={3}
                value={form.metaDescription}
                onChange={(e) =>
                  setForm({ ...form, metaDescription: e.target.value })
                }
                maxLength={200}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
