'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Save, Loader2, ExternalLink, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

import {
  getMedia,
  updateMedia,
  deleteMediaItem,
  ApiError,
  type MediaItem,
} from '@/lib/media/client'
import { mediaUrl, humanFileSize, isImage, isVideo } from '@/lib/media/url'

interface Usage {
  id: string
  entityType: string
  entityId: string
  field: string
}

export default function MediaDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(props.params)
  const router = useRouter()
  const { toast } = useToast()

  const [media, setMedia] = useState<(MediaItem & { usages: Usage[] }) | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [filename, setFilename] = useState('')

  useEffect(() => {
    getMedia(id)
      .then(({ media }) => {
        setMedia(media as typeof media & { usages: Usage[] })
        setAltText(media.altText ?? '')
        setCaption(media.caption ?? '')
        setFilename(media.filename ?? '')
      })
      .catch((err) =>
        toast({
          title: 'Failed to load',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        })
      )
      .finally(() => setLoading(false))
  }, [id, toast])

  async function handleSave() {
    setSaving(true)
    try {
      const { media: updated } = await updateMedia(id, {
        altText: altText || null,
        caption: caption || null,
        filename,
      })
      setMedia((m) => (m ? { ...m, ...updated } : m))
      toast({ title: 'Saved' })
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

  async function handleDelete(force = false) {
    if (!window.confirm(force ? 'Force-delete? References will break.' : 'Delete this media?')) return
    try {
      await deleteMediaItem(id, force)
      toast({ title: 'Deleted' })
      router.push('/admin/media')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'IN_USE') {
        if (window.confirm('This media is in use. Force-delete anyway?')) {
          handleDelete(true)
        }
      } else {
        toast({
          title: 'Delete failed',
          description: err instanceof Error ? err.message : String(err),
          variant: 'destructive',
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!media) {
    return <div className="text-muted-foreground">Media not found.</div>
  }

  const url = mediaUrl(media, 'lg') ?? mediaUrl(media, 'md') ?? mediaUrl(media, 'original')
  const originalUrl = mediaUrl(media, 'original')

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/media">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Preview */}
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-center bg-slate-50 rounded-md overflow-hidden min-h-[360px]">
            {isImage(media.mimeType) && url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={media.altText ?? ''} className="max-h-[600px] object-contain" />
            ) : isVideo(media.mimeType) && originalUrl ? (
              <video controls src={originalUrl} className="max-h-[600px]" />
            ) : originalUrl ? (
              <Link
                href={originalUrl}
                target="_blank"
                className="flex items-center gap-2 text-primary"
              >
                <ExternalLink className="h-5 w-5" />
                Open file
              </Link>
            ) : (
              <p className="text-muted-foreground">No preview</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <h3 className="font-semibold text-sm">File info</h3>
            <InfoRow label="Type" value={media.mimeType} />
            <InfoRow label="Size" value={humanFileSize(media.size)} />
            {media.width && media.height && (
              <InfoRow label="Dimensions" value={`${media.width} × ${media.height}`} />
            )}
            <InfoRow
              label="Uploaded"
              value={new Date(media.createdAt).toLocaleDateString()}
            />
            {originalUrl && (
              <div className="pt-2 border-t flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + originalUrl)
                    toast({ title: 'URL copied' })
                  }}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy URL
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={originalUrl} target="_blank">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Open
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-3">
            <h3 className="font-semibold text-sm">Metadata</h3>
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt">
                Alt text{' '}
                {isImage(media.mimeType) && (
                  <span className="text-xs text-muted-foreground">
                    (required before publish)
                  </span>
                )}
              </Label>
              <Input
                id="alt"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-2">
            <h3 className="font-semibold text-sm">
              Usages{' '}
              <span className="text-muted-foreground font-normal">
                ({media.usages.length})
              </span>
            </h3>
            {media.usages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not referenced anywhere.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {media.usages.map((u) => (
                  <li key={u.id} className="flex justify-between">
                    <span className="font-mono text-xs">
                      {u.entityType}:{u.entityId.slice(0, 8)}
                    </span>
                    <span className="text-muted-foreground">{u.field}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            variant="destructive"
            onClick={() => handleDelete(false)}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </aside>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
