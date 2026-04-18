'use client'

import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  LayoutPanelTop,
  LayoutGrid,
  Type,
  Megaphone,
  HelpCircle,
  Quote as QuoteIcon,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getBlockForm } from './blocks/BlockForms'

export interface BuilderSection {
  id?: string // undefined if not yet persisted
  tempId: string // stable client-side id for reorder/edit
  blockType: string
  data: unknown
  isActive: boolean
}

export interface BlockCatalogueEntry {
  type: string
  label: string
  description: string
  icon: string
  defaults: () => unknown
}

export interface BlockBuilderProps {
  sections: BuilderSection[]
  onChange: (next: BuilderSection[]) => void
  catalogue: BlockCatalogueEntry[]
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutPanelTop,
  LayoutGrid,
  Type,
  Megaphone,
  HelpCircle,
  Quote: QuoteIcon,
}

function getIcon(name: string) {
  return ICONS[name] ?? LayoutPanelTop
}

export function BlockBuilder({
  sections,
  onChange,
  catalogue,
}: BlockBuilderProps) {
  const [pickerOpen, setPickerOpen] = useState<{ insertAt: number } | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  function genTempId() {
    return 'tmp_' + Math.random().toString(36).slice(2, 10)
  }

  function addBlock(type: string, insertAt: number) {
    const entry = catalogue.find((c) => c.type === type)
    if (!entry) return
    const next: BuilderSection = {
      tempId: genTempId(),
      blockType: type,
      data: entry.defaults(),
      isActive: true,
    }
    const arr = [...sections]
    arr.splice(insertAt, 0, next)
    onChange(arr)
    setEditingIdx(insertAt)
  }

  function move(idx: number, delta: number) {
    const target = idx + delta
    if (target < 0 || target >= sections.length) return
    const arr = [...sections]
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }

  function remove(idx: number) {
    if (!window.confirm('Remove this block?')) return
    onChange(sections.filter((_, i) => i !== idx))
  }

  function duplicate(idx: number) {
    const src = sections[idx]
    const copy: BuilderSection = {
      ...src,
      id: undefined,
      tempId: genTempId(),
      data: JSON.parse(JSON.stringify(src.data)),
    }
    const arr = [...sections]
    arr.splice(idx + 1, 0, copy)
    onChange(arr)
  }

  function toggleActive(idx: number) {
    onChange(
      sections.map((s, i) => (i === idx ? { ...s, isActive: !s.isActive } : s))
    )
  }

  function updateData(idx: number, data: unknown) {
    onChange(sections.map((s, i) => (i === idx ? { ...s, data } : s)))
  }

  return (
    <div className="space-y-3">
      <AddButton onClick={() => setPickerOpen({ insertAt: 0 })} />

      {sections.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center text-muted-foreground">
          No blocks yet. Click <strong>+ Add block</strong> above to start.
        </div>
      )}

      {sections.map((section, idx) => {
        const entry = catalogue.find((c) => c.type === section.blockType)
        const Icon = getIcon(entry?.icon ?? 'LayoutPanelTop')
        const Form = getBlockForm(section.blockType)
        const isEditing = editingIdx === idx

        return (
          <div key={section.tempId}>
            <div
              className={cn(
                'rounded-lg border bg-white',
                !section.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-3 p-3 border-b bg-slate-50 rounded-t-lg">
                <Icon className="h-5 w-5 text-mcaforo-orange shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {entry?.label ?? section.blockType}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {sectionPreview(section)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(idx)}
                    title={section.isActive ? 'Hide' : 'Show'}
                  >
                    {section.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(idx, 1)}
                    disabled={idx === sections.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicate(idx)}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => remove(idx)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingIdx(isEditing ? null : idx)}
                  >
                    {isEditing ? 'Close' : 'Edit'}
                  </Button>
                </div>
              </div>
              {isEditing && (
                <div className="p-4">
                  {Form ? (
                    <Form
                      data={section.data}
                      onChange={(d) => updateData(idx, d)}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No form registered for block type{' '}
                      <code>{section.blockType}</code>.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="my-1">
              <AddButton
                variant="inline"
                onClick={() => setPickerOpen({ insertAt: idx + 1 })}
              />
            </div>
          </div>
        )
      })}

      <BlockPicker
        open={pickerOpen !== null}
        onOpenChange={(o) => !o && setPickerOpen(null)}
        catalogue={catalogue}
        onPick={(type) => {
          if (pickerOpen) addBlock(type, pickerOpen.insertAt)
          setPickerOpen(null)
        }}
      />
    </div>
  )
}

function sectionPreview(section: BuilderSection): string {
  const d = section.data as Record<string, unknown> | null | undefined
  if (!d) return ''
  if (typeof d.heading === 'string') return d.heading
  if (typeof d.title === 'string') return d.title as string
  if (Array.isArray(d.items)) return `${(d.items as unknown[]).length} item(s)`
  return ''
}

function AddButton({
  onClick,
  variant = 'block',
}: {
  onClick: () => void
  variant?: 'block' | 'inline'
}) {
  if (variant === 'inline') {
    return (
      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="h-7 text-xs text-muted-foreground hover:text-primary"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add block below
        </Button>
      </div>
    )
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="w-full border-dashed"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add block
    </Button>
  )
}

function BlockPicker({
  open,
  onOpenChange,
  catalogue,
  onPick,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  catalogue: BlockCatalogueEntry[]
  onPick: (type: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a block</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {catalogue.map((entry) => {
            const Icon = getIcon(entry.icon)
            return (
              <button
                key={entry.type}
                type="button"
                onClick={() => onPick(entry.type)}
                className="group flex items-start gap-3 rounded-lg border p-4 text-left hover:border-mcaforo-orange hover:bg-mcaforo-orange/5 transition"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-mcaforo-orange/10 text-mcaforo-orange flex items-center justify-center group-hover:bg-mcaforo-orange group-hover:text-white transition">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{entry.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
