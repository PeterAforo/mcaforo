'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface Settings {
  id: string
  siteName?: string | null
  tagline?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  socials?: Record<string, string> | null
  logo?: string | null
  logoDark?: string | null
  favicon?: string | null
  ogDefaultImage?: string | null
  footerHtml?: string | null
  gtmId?: string | null
  gaMeasurementId?: string | null
  noindexAll?: boolean
  maintenanceMode?: boolean
  robotsExtra?: string | null
}

export default function SiteSettingsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<Settings>({ id: 'singleton' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings/site')
      .then((r) => r.json())
      .then((d) => { if (d.settings) setData(d.settings) })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { id: _id, ...payload } = data
      const res = await fetch('/api/admin/settings/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      toast({ title: 'Settings saved' })
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

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setData({ ...data, [k]: v })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site settings</h1>
          <p className="text-sm text-muted-foreground">
            Global configuration used across the public site, sitemap and robots.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Branding</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Site name">
              <Input value={data.siteName ?? ''} onChange={(e) => set('siteName', e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={data.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Logo URL">
              <Input value={data.logo ?? ''} onChange={(e) => set('logo', e.target.value)} />
            </Field>
            <Field label="Dark-mode logo URL">
              <Input value={data.logoDark ?? ''} onChange={(e) => set('logoDark', e.target.value)} />
            </Field>
            <Field label="Favicon URL">
              <Input value={data.favicon ?? ''} onChange={(e) => set('favicon', e.target.value)} />
            </Field>
            <Field label="Default OpenGraph image">
              <Input value={data.ogDefaultImage ?? ''} onChange={(e) => set('ogDefaultImage', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={data.contactEmail ?? ''} onChange={(e) => set('contactEmail', e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={data.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={data.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Socials</h2>
          <p className="text-xs text-muted-foreground">
            Full URLs. Blank rows will be ignored.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'github'].map((k) => (
              <Field key={k} label={k}>
                <Input
                  value={data.socials?.[k] ?? ''}
                  onChange={(e) =>
                    set('socials', { ...(data.socials ?? {}), [k]: e.target.value })
                  }
                />
              </Field>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Google Tag Manager ID">
              <Input placeholder="GTM-XXXXXX" value={data.gtmId ?? ''} onChange={(e) => set('gtmId', e.target.value)} />
            </Field>
            <Field label="GA4 Measurement ID">
              <Input placeholder="G-XXXXXXXXXX" value={data.gaMeasurementId ?? ''} onChange={(e) => set('gaMeasurementId', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">SEO / visibility</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data.noindexAll}
              onChange={(e) => set('noindexAll', e.target.checked)}
              className="h-4 w-4"
            />
            <span>
              <span className="font-medium">Block all search engines</span>
              <span className="text-xs text-muted-foreground block">
                Sets <code>Disallow: /</code> in robots.txt. Use while the site is pre-launch.
              </span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data.maintenanceMode}
              onChange={(e) => set('maintenanceMode', e.target.checked)}
              className="h-4 w-4"
            />
            <span>
              <span className="font-medium">Maintenance mode</span>
              <span className="text-xs text-muted-foreground block">
                Display a maintenance page to anonymous visitors. Admins can still access the site.
              </span>
            </span>
          </label>
          <Field label="Footer HTML">
            <Textarea
              rows={3}
              value={data.footerHtml ?? ''}
              onChange={(e) => set('footerHtml', e.target.value)}
              placeholder="© 2026 McAforo. All rights reserved."
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground capitalize">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
