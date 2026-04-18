'use client'

import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { mediaUrl } from '@/lib/media/url'
import type { MediaItem } from '@/lib/media/client'
import type { TipTapDoc } from '@/lib/cms/richtext'

/**
 * Admin forms for each built-in block type.
 *
 * Each form is a controlled component that receives `data` + `onChange`.
 * Callers (the BlockBuilder) map `blockType -> Form` via `getBlockForm()`.
 *
 * These forms intentionally stay schema-light: they render a UI for the most
 * common fields, and defer strict validation to the API layer (Zod via the
 * block registry). This keeps the admin flexible while backend enforces
 * integrity.
 */

export interface BlockFormProps<T = unknown> {
  data: T
  onChange: (next: T) => void
}

// ---------- HERO ----------
export function HeroForm({ data, onChange }: BlockFormProps<any>) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="space-y-4">
      <Field label="Eyebrow">
        <Input
          value={data.eyebrow ?? ''}
          onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          placeholder="Optional small label above the heading"
        />
      </Field>
      <Field label="Heading" required>
        <Input
          value={data.heading ?? ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
        />
      </Field>
      <Field label="Body">
        <RichTextEditor
          value={data.body as TipTapDoc | null}
          onChange={(doc) => onChange({ ...data, body: doc })}
          minHeight={140}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <CtaFields
          label="Primary CTA"
          value={data.primaryCta}
          onChange={(v) => onChange({ ...data, primaryCta: v })}
        />
        <CtaFields
          label="Secondary CTA"
          value={data.secondaryCta}
          onChange={(v) => onChange({ ...data, secondaryCta: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Variant">
          <Select
            value={data.variant ?? 'default'}
            onChange={(v) => onChange({ ...data, variant: v })}
            options={[
              { value: 'default', label: 'Default (left)' },
              { value: 'centered', label: 'Centered' },
              { value: 'split', label: 'Split' },
            ]}
          />
        </Field>
        <Field label="Background image">
          <div className="flex gap-2">
            <Input
              value={data.backgroundImage ?? ''}
              onChange={(e) =>
                onChange({ ...data, backgroundImage: e.target.value })
              }
              placeholder="/uploads/... or empty"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(true)}
            >
              Pick
            </Button>
          </div>
          <MediaPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            accept="image"
            onSelect={(m) => {
              const media = m as MediaItem
              const url = mediaUrl(media, 'lg') ?? mediaUrl(media, 'md')
              if (url) onChange({ ...data, backgroundImage: url })
            }}
          />
        </Field>
      </div>
    </div>
  )
}

// ---------- FEATURE GRID ----------
export function FeatureGridForm({ data, onChange }: BlockFormProps<any>) {
  const items = (data.items ?? []) as Array<{
    icon: string
    title: string
    description: string
  }>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Eyebrow">
          <Input
            value={data.eyebrow ?? ''}
            onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          />
        </Field>
        <Field label="Columns">
          <Select
            value={String(data.columns ?? 3)}
            onChange={(v) => onChange({ ...data, columns: Number(v) })}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]}
          />
        </Field>
      </div>
      <Field label="Heading">
        <Input
          value={data.heading ?? ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
        />
      </Field>
      <Field label="Subheading">
        <Textarea
          rows={2}
          value={data.subheading ?? ''}
          onChange={(e) => onChange({ ...data, subheading: e.target.value })}
        />
      </Field>
      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((item, i) => (
          <div key={i} className="rounded-md border bg-slate-50 p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                className="w-32"
                placeholder="Icon (lucide)"
                value={item.icon}
                onChange={(e) =>
                  onChange({
                    ...data,
                    items: items.map((it, idx) =>
                      idx === i ? { ...it, icon: e.target.value } : it
                    ),
                  })
                }
              />
              <Input
                placeholder="Title"
                value={item.title}
                onChange={(e) =>
                  onChange({
                    ...data,
                    items: items.map((it, idx) =>
                      idx === i ? { ...it, title: e.target.value } : it
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() =>
                  onChange({
                    ...data,
                    items: items.filter((_, idx) => idx !== i),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                onChange({
                  ...data,
                  items: items.map((it, idx) =>
                    idx === i ? { ...it, description: e.target.value } : it
                  ),
                })
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...data,
              items: [
                ...items,
                { icon: 'Star', title: 'New item', description: '' },
              ],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>
    </div>
  )
}

// ---------- RICH TEXT ----------
export function RichTextForm({ data, onChange }: BlockFormProps<any>) {
  return (
    <div className="space-y-4">
      <Field label="Width">
        <Select
          value={data.width ?? 'medium'}
          onChange={(v) => onChange({ ...data, width: v })}
          options={[
            { value: 'narrow', label: 'Narrow' },
            { value: 'medium', label: 'Medium' },
            { value: 'wide', label: 'Wide' },
          ]}
        />
      </Field>
      <Field label="Content" required>
        <RichTextEditor
          value={data.content as TipTapDoc | null}
          onChange={(doc) => onChange({ ...data, content: doc })}
          minHeight={260}
        />
      </Field>
    </div>
  )
}

// ---------- CTA ----------
export function CtaForm({ data, onChange }: BlockFormProps<any>) {
  return (
    <div className="space-y-4">
      <Field label="Heading" required>
        <Input
          value={data.heading ?? ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
        />
      </Field>
      <Field label="Body">
        <Textarea
          rows={2}
          value={data.body ?? ''}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <CtaFields
          label="Primary CTA"
          required
          value={data.primaryCta}
          onChange={(v) => onChange({ ...data, primaryCta: v })}
        />
        <CtaFields
          label="Secondary CTA"
          value={data.secondaryCta}
          onChange={(v) => onChange({ ...data, secondaryCta: v })}
        />
      </div>
      <Field label="Theme">
        <Select
          value={data.theme ?? 'orange'}
          onChange={(v) => onChange({ ...data, theme: v })}
          options={[
            { value: 'orange', label: 'Orange (brand)' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
        />
      </Field>
    </div>
  )
}

// ---------- FAQ ----------
export function FaqForm({ data, onChange }: BlockFormProps<any>) {
  const items = (data.items ?? []) as Array<{ question: string; answer: string }>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Eyebrow">
          <Input
            value={data.eyebrow ?? ''}
            onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          />
        </Field>
        <Field label="Heading">
          <Input
            value={data.heading ?? ''}
            onChange={(e) => onChange({ ...data, heading: e.target.value })}
          />
        </Field>
      </div>
      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((item, i) => (
          <div key={i} className="rounded-md border bg-slate-50 p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Question"
                value={item.question}
                onChange={(e) =>
                  onChange({
                    ...data,
                    items: items.map((it, idx) =>
                      idx === i ? { ...it, question: e.target.value } : it
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() =>
                  onChange({
                    ...data,
                    items: items.filter((_, idx) => idx !== i),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              placeholder="Answer"
              value={item.answer}
              onChange={(e) =>
                onChange({
                  ...data,
                  items: items.map((it, idx) =>
                    idx === i ? { ...it, answer: e.target.value } : it
                  ),
                })
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...data,
              items: [...items, { question: '', answer: '' }],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Q&amp;A
        </Button>
      </div>
    </div>
  )
}

// ---------- TESTIMONIALS ----------
export function TestimonialsForm({ data, onChange }: BlockFormProps<any>) {
  const items = (data.items ?? []) as Array<{
    quote: string
    authorName: string
    authorRole?: string
    authorCompany?: string
    authorPhoto?: string
  }>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Heading">
          <Input
            value={data.heading ?? ''}
            onChange={(e) => onChange({ ...data, heading: e.target.value })}
          />
        </Field>
        <Field label="Layout">
          <Select
            value={data.layout ?? 'grid'}
            onChange={(v) => onChange({ ...data, layout: v })}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'single', label: 'Single' },
            ]}
          />
        </Field>
      </div>
      <div className="space-y-2">
        <Label>Testimonials</Label>
        {items.map((item, i) => (
          <div key={i} className="rounded-md border bg-slate-50 p-3 space-y-2">
            <Textarea
              rows={3}
              placeholder="Quote"
              value={item.quote}
              onChange={(e) =>
                onChange({
                  ...data,
                  items: items.map((it, idx) =>
                    idx === i ? { ...it, quote: e.target.value } : it
                  ),
                })
              }
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Name"
                value={item.authorName}
                onChange={(e) =>
                  onChange({
                    ...data,
                    items: items.map((it, idx) =>
                      idx === i ? { ...it, authorName: e.target.value } : it
                    ),
                  })
                }
              />
              <Input
                placeholder="Role"
                value={item.authorRole ?? ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    items: items.map((it, idx) =>
                      idx === i ? { ...it, authorRole: e.target.value } : it
                    ),
                  })
                }
              />
              <Input
                placeholder="Company"
                value={item.authorCompany ?? ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    items: items.map((it, idx) =>
                      idx === i ? { ...it, authorCompany: e.target.value } : it
                    ),
                  })
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() =>
                onChange({
                  ...data,
                  items: items.filter((_, idx) => idx !== i),
                })
              }
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...data,
              items: [
                ...items,
                { quote: '', authorName: '', authorRole: '', authorCompany: '' },
              ],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add testimonial
        </Button>
      </div>
    </div>
  )
}

// ---------- Shared helpers ----------

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function CtaFields({
  label,
  required,
  value,
  onChange,
}: {
  label: string
  required?: boolean
  value?: { label: string; href: string }
  onChange: (v: { label: string; href: string } | undefined) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder="Label"
          value={value?.label ?? ''}
          onChange={(e) => {
            const next = { label: e.target.value, href: value?.href ?? '' }
            onChange(next.label || next.href ? next : undefined)
          }}
        />
        <Input
          placeholder="/path"
          value={value?.href ?? ''}
          onChange={(e) => {
            const next = { label: value?.label ?? '', href: e.target.value }
            onChange(next.label || next.href ? next : undefined)
          }}
        />
      </div>
    </div>
  )
}

// Registry of forms keyed by block type
export const BLOCK_FORMS: Record<
  string,
  React.ComponentType<BlockFormProps<any>>
> = {
  hero: HeroForm,
  featureGrid: FeatureGridForm,
  richText: RichTextForm,
  cta: CtaForm,
  faq: FaqForm,
  testimonials: TestimonialsForm,
}

export function getBlockForm(
  type: string
): React.ComponentType<BlockFormProps<any>> | null {
  return BLOCK_FORMS[type] ?? null
}
