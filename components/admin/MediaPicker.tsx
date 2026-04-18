'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload,
  Search,
  Loader2,
  ImageIcon,
  Check,
  X,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import {
  listMedia,
  uploadFile,
  type MediaItem,
} from '@/lib/media/client'
import { mediaUrl, isImage } from '@/lib/media/url'

/**
 * Reusable media picker dialog.
 *
 * Usage:
 *   <MediaPicker
 *     open={open}
 *     onOpenChange={setOpen}
 *     onSelect={(media) => setFeaturedImage(media.id)}
 *     accept="image"  // "image" | "video" | "any"
 *   />
 *
 * Uploads written inside the picker go straight into the library. Multi-select
 * is supported when `multiple` is true; single-select returns the chosen
 * MediaItem immediately on click.
 */

export interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaItem | MediaItem[]) => void
  accept?: 'image' | 'video' | 'any'
  multiple?: boolean
  title?: string
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  accept = 'any',
  multiple = false,
  title = 'Select media',
}: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const mimeFilter = accept === 'any' ? undefined : accept
      const { items } = await listMedia({
        mime: mimeFilter,
        search: search || undefined,
        limit: 60,
      })
      setItems(items)
    } finally {
      setLoading(false)
    }
  }, [accept, search])

  useEffect(() => {
    if (open) {
      setSelected(new Set())
      load()
    }
  }, [open, load])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file)
      }
      await load()
    } finally {
      setUploading(false)
    }
  }

  function toggle(id: string) {
    if (!multiple) {
      const item = items.find((i) => i.id === id)
      if (item) {
        onSelect(item)
        onOpenChange(false)
      }
      return
    }
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function confirmMulti() {
    const chosen = items.filter((i) => selected.has(i.id))
    onSelect(chosen)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={
              accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : undefined
            }
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded border bg-slate-50 p-3">
          {loading || uploading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
              <p>No media found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {items.map((item) => {
                const url = mediaUrl(item, 'thumb') ?? mediaUrl(item, 'sm')
                const isSel = selected.has(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={cn(
                      'group relative aspect-square rounded border-2 bg-white overflow-hidden transition',
                      isSel ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-slate-300'
                    )}
                  >
                    {isImage(item.mimeType) && url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={item.altText ?? ''}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-xs p-2 text-center">
                        <span className="truncate">{item.filename}</span>
                      </div>
                    )}
                    {isSel && (
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          {multiple && (
            <Button onClick={confirmMulti} disabled={selected.size === 0}>
              <Check className="mr-2 h-4 w-4" />
              Select ({selected.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
