'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Trash2, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PublishControls } from '@/components/admin/PublishControls'
import { RevisionsPanel } from '@/components/admin/RevisionsPanel'

type FieldType = 'string' | 'text' | 'number' | 'boolean' | 'stringArray' | 'json' | 'enum' | 'media'

interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: string[]
  placeholder?: string
  required?: boolean
}

/**
 * Per-resource field configuration. Kept client-side for simplicity — the
 * backend enforces strict Zod validation anyway.
 */
const FIELDS: Record<string, FieldDef[]> = {
  services: [
    { key: 'slug', label: 'Slug', type: 'string', required: true },
    { key: 'title', label: 'Title', type: 'string', required: true },
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'icon', label: 'Icon (lucide)', type: 'string' },
    { key: 'featuredImage', label: 'Featured image URL', type: 'media' },
    { key: 'features', label: 'Features', type: 'stringArray' },
    { key: 'pricingNote', label: 'Pricing note', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
    { key: 'status', label: 'Status', type: 'enum', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
  ],
  products: [
    { key: 'slug', label: 'Slug', type: 'string', required: true },
    { key: 'title', label: 'Title', type: 'string', required: true },
    { key: 'tagline', label: 'Tagline', type: 'string' },
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'icon', label: 'Icon', type: 'string' },
    { key: 'heroImage', label: 'Hero image', type: 'media' },
    { key: 'screenshots', label: 'Screenshots (URLs)', type: 'stringArray' },
    { key: 'features', label: 'Features', type: 'stringArray' },
    { key: 'demoUrl', label: 'Demo URL', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
    { key: 'status', label: 'Status', type: 'enum', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
  ],
  portfolio: [
    { key: 'slug', label: 'Slug', type: 'string', required: true },
    { key: 'client', label: 'Client', type: 'string', required: true },
    { key: 'title', label: 'Title', type: 'string', required: true },
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'heroImage', label: 'Hero image', type: 'media' },
    { key: 'gallery', label: 'Gallery (URLs)', type: 'stringArray' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
    { key: 'status', label: 'Status', type: 'enum', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
  ],
  'case-studies': [
    { key: 'slug', label: 'Slug', type: 'string', required: true },
    { key: 'title', label: 'Title', type: 'string', required: true },
    { key: 'client', label: 'Client', type: 'string', required: true },
    { key: 'industry', label: 'Industry', type: 'string' },
    { key: 'summary', label: 'Summary', type: 'text', required: true },
    { key: 'heroImage', label: 'Hero image', type: 'media' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'metaTitle', label: 'Meta title', type: 'string' },
    { key: 'metaDescription', label: 'Meta description', type: 'text' },
    { key: 'status', label: 'Status', type: 'enum', options: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] },
  ],
  team: [
    { key: 'slug', label: 'Slug', type: 'string', required: true },
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'role', label: 'Role', type: 'string', required: true },
    { key: 'bio', label: 'Bio', type: 'text' },
    { key: 'photo', label: 'Photo', type: 'media' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  testimonials: [
    { key: 'authorName', label: 'Author name', type: 'string', required: true },
    { key: 'authorRole', label: 'Role', type: 'string' },
    { key: 'authorCompany', label: 'Company', type: 'string' },
    { key: 'authorPhoto', label: 'Photo', type: 'media' },
    { key: 'quote', label: 'Quote', type: 'text', required: true },
    { key: 'rating', label: 'Rating (1-5)', type: 'number' },
    { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  faqs: [
    { key: 'question', label: 'Question', type: 'string', required: true },
    { key: 'answer', label: 'Answer', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  values: [
    { key: 'title', label: 'Title', type: 'string', required: true },
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'icon', label: 'Icon', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  'process-steps': [
    { key: 'step', label: 'Step number', type: 'number', required: true },
    { key: 'title', label: 'Title', type: 'string', required: true },
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'icon', label: 'Icon', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  stats: [
    { key: 'label', label: 'Label', type: 'string', required: true },
    { key: 'value', label: 'Value', type: 'string', required: true },
    { key: 'suffix', label: 'Suffix', type: 'string' },
    { key: 'icon', label: 'Icon', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  partners: [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'logo', label: 'Logo', type: 'media', required: true },
    { key: 'url', label: 'Website', type: 'string' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
}

export default function ResourceEditPage(props: {
  params: Promise<{ resource: string; id: string }>
}) {
  const { resource, id } = use(props.params)
  const router = useRouter()
  const { toast } = useToast()
  const isNew = id === 'new'
  const fields = FIELDS[resource] ?? []
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) {
      const defaults: Record<string, unknown> = {}
      fields.forEach((f) => {
        if (f.type === 'boolean') defaults[f.key] = true
        if (f.type === 'number') defaults[f.key] = 0
        if (f.type === 'stringArray') defaults[f.key] = []
        if (f.type === 'enum' && f.options) defaults[f.key] = f.options[0]
      })
      setData(defaults)
      return
    }
    fetch(`/api/admin/content/${resource}/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.item) setData(d.item)
        else toast({ title: 'Not found', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [resource, id, isNew])

  async function save() {
    setSaving(true)
    try {
      const url = isNew
        ? `/api/admin/content/${resource}`
        : `/api/admin/content/${resource}/${id}`
      const method = isNew ? 'POST' : 'PATCH'
      const body: Record<string, unknown> = {}
      fields.forEach((f) => {
        const v = data[f.key]
        // Skip undefined/empty optional nullable strings for clean payloads
        if (v === undefined) return
        body[f.key] = v
      })
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error + (j.details ? ' — ' + JSON.stringify(j.details) : ''))
      }
      const result = await res.json()
      toast({ title: 'Saved' })
      if (isNew && result.item) {
        router.push(`/admin/content/${resource}/${result.item.id}`)
      }
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (fields.length === 0) {
    return <div className="text-muted-foreground">Unknown resource: {resource}</div>
  }

  const publicPath = buildPublicPath(resource, data)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/content/${resource}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            {isNew ? 'New' : 'Edit'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && <RevisionsPanel resource={resource} id={id} />}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-white p-6 space-y-4">
          {fields.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={data[f.key]}
              onChange={(v) => setData({ ...data, [f.key]: v })}
            />
          ))}
        </div>

        {!isNew && (
          <aside className="space-y-4">
            <PublishControls
              resource={resource}
              id={id}
              status={data.status as string | undefined}
              scheduledAt={data.scheduledAt as string | null | undefined}
              publicPath={publicPath}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

/**
 * Best-effort public URL for the Preview button. Uses slug when available.
 */
function buildPublicPath(
  resource: string,
  data: Record<string, unknown>
): string | undefined {
  const slug = data.slug as string | undefined
  if (!slug) return undefined
  const map: Record<string, (s: string) => string> = {
    services: (s) => `/services/${s}`,
    products: (s) => `/products/${s}`,
    portfolio: (s) => `/projects/${s}`,
    'case-studies': (s) => `/case-studies/${s}`,
  }
  return map[resource]?.(slug)
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  const labelEl = (
    <Label>
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  )

  switch (field.type) {
    case 'string':
    case 'media':
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            value={(value as string | null | undefined) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      )
    case 'text':
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Textarea
            rows={4}
            value={(value as string | null | undefined) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      )
    case 'number':
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            type="number"
            value={(value as number | null | undefined) ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span>{field.label}</span>
        </label>
      )
    case 'enum':
      return (
        <div className="space-y-1.5">
          {labelEl}
          <select
            value={(value as string | undefined) ?? field.options?.[0] ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {field.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )
    case 'stringArray': {
      const arr = (Array.isArray(value) ? value : []) as string[]
      return (
        <div className="space-y-1.5">
          {labelEl}
          <div className="space-y-1">
            {arr.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={v}
                  onChange={(e) =>
                    onChange(arr.map((x, idx) => (idx === i ? e.target.value : x)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(arr.filter((_, idx) => idx !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange([...arr, ''])}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      )
    }
    default:
      return null
  }
}
