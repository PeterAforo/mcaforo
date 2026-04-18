'use client'

import { useEffect, useState } from 'react'
import { History, Loader2, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface Revision {
  id: string
  message: string | null
  createdAt: string
  author?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

/**
 * Sprint 4 UX polish: Revisions side sheet for the admin edit screen.
 *
 * Lists up to 50 revisions for the current entity and lets the user
 * restore any one — backed by `/api/admin/content/:resource/:id/revisions`.
 */
export function RevisionsPanel({
  resource,
  id,
  onRestored,
}: {
  resource: string
  id: string
  onRestored?: () => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Revision[]>([])
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/admin/content/${resource}/${id}/revisions`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => toast({ title: 'Failed to load revisions', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [open, resource, id, toast])

  async function restore(revisionId: string) {
    if (!window.confirm('Restore this revision? Current content will be overwritten (a new revision will be saved automatically).')) return
    setRestoring(revisionId)
    try {
      const res = await fetch(`/api/admin/content/${resource}/${id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      toast({ title: 'Restored' })
      setOpen(false)
      onRestored?.()
    } catch (err) {
      toast({
        title: 'Restore failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setRestoring(null)
    }
  }

  function authorName(a: Revision['author']): string {
    if (!a) return 'Unknown'
    const n = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim()
    return n || a.email || 'Unknown'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revision history</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No revisions yet. They're created automatically on every save.
            </p>
          )}
          <ul className="divide-y">
            {items.map((rev) => (
              <li key={rev.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {rev.message ?? 'Auto-saved'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleString()} · {authorName(rev.author)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={restoring === rev.id}
                  onClick={() => restore(rev.id)}
                >
                  {restoring === rev.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
