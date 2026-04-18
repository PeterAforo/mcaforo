'use client'

import { useState } from 'react'
import { Loader2, Rocket, EyeOff, Clock, XCircle, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

/**
 * Sprint 4 UX polish: Publish controls for the admin edit screen.
 *
 * Talks to `POST /api/admin/content/:resource/:id/publish` which dispatches
 * to the publishing state machine in `@/lib/cms/publish.ts`.
 */
export function PublishControls({
  resource,
  id,
  status,
  scheduledAt,
  publicPath,
  onChange,
}: {
  resource: string
  id: string
  status?: string
  scheduledAt?: string | null
  publicPath?: string
  onChange?: () => void
}) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [runAt, setRunAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    return d.toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm for datetime-local
  })

  async function call(body: Record<string, unknown>, okMsg: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/content/${resource}/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      toast({ title: okMsg })
      onChange?.()
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  async function preview() {
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: resourceToEntityType(resource),
          entityId: id,
          redirectTo: publicPath ?? '/',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { url } = await res.json()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'Preview failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    }
  }

  const isPublished = status === 'PUBLISHED'
  const isScheduled = status === 'SCHEDULED'

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status</span>
        <StatusBadge status={status} />
      </div>

      {isScheduled && scheduledAt && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Publishes {new Date(scheduledAt).toLocaleString()}
        </p>
      )}

      <div className="space-y-2">
        {!isPublished && (
          <Button
            className="w-full justify-start"
            onClick={() => call({ action: 'publish' }, 'Published')}
            disabled={busy}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
            Publish now
          </Button>
        )}

        {isPublished && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => call({ action: 'unpublish' }, 'Unpublished')}
            disabled={busy}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Unpublish
          </Button>
        )}

        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start" disabled={busy}>
              <Clock className="mr-2 h-4 w-4" />
              {isScheduled ? 'Reschedule' : 'Schedule'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule publication</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Publish at</Label>
              <Input
                type="datetime-local"
                value={runAt}
                onChange={(e) => setRunAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The content will become public at this time. Timezone: your browser local.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button
                onClick={() =>
                  call(
                    {
                      action: 'schedule',
                      runAt: new Date(runAt).toISOString(),
                      scheduleAction: 'PUBLISH',
                    },
                    'Scheduled'
                  ).then(() => setScheduleOpen(false))
                }
                disabled={busy}
              >
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isScheduled && (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600"
            onClick={() => call({ action: 'cancel-schedule' }, 'Schedule cancelled')}
            disabled={busy}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel schedule
          </Button>
        )}

        <Button variant="ghost" className="w-full justify-start" onClick={preview}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    PUBLISHED: { label: 'Published', variant: 'default' },
    DRAFT: { label: 'Draft', variant: 'secondary' },
    SCHEDULED: { label: 'Scheduled', variant: 'outline' },
    ARCHIVED: { label: 'Archived', variant: 'secondary' },
  }
  const info = map[status ?? 'DRAFT'] ?? { label: status ?? 'Unknown', variant: 'secondary' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

/**
 * URL-slug -> entity model name mapping, mirroring `@/lib/cms/resources.ts`.
 */
function resourceToEntityType(slug: string): string {
  const map: Record<string, string> = {
    services: 'MarketingService',
    products: 'MarketingProduct',
    portfolio: 'Portfolio',
    'case-studies': 'CaseStudy',
    team: 'TeamMember',
    testimonials: 'Testimonial',
    faqs: 'FAQ',
    values: 'Value',
    'process-steps': 'ProcessStep',
    stats: 'Stat',
    partners: 'Partner',
  }
  return map[slug] ?? slug
}
