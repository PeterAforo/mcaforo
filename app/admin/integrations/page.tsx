'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, MessageSquare, Mail, Settings2, Plug, Power } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

interface Provider {
  id: string
  category: 'PAYMENT' | 'SMS' | 'EMAIL' | 'STORAGE' | 'OTHER'
  provider: string
  name: string
  description: string | null
  config: Record<string, string | number | boolean>
  isActive: boolean
  isDefault: boolean
  testMode: boolean
}

const categoryIcons = {
  PAYMENT: CreditCard,
  SMS: MessageSquare,
  EMAIL: Mail,
  STORAGE: Plug,
  OTHER: Plug,
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{ open: boolean; provider?: Provider }>({ open: false })
  const [config, setConfig] = useState<Record<string, string | number | boolean>>({})
  const [testMode, setTestMode] = useState(true)

  const load = async () => {
    const res = await fetch('/api/admin/integrations')
    if (res.ok) {
      const data = await res.json()
      setProviders(data.providers || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = (p: Provider) => {
    setConfig({ ...(p.config || {}) })
    setTestMode(p.testMode)
    setEditDialog({ open: true, provider: p })
  }

  const saveConfig = async () => {
    if (!editDialog.provider) return
    const res = await fetch(`/api/admin/integrations/${editDialog.provider.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, testMode }),
    })
    if (res.ok) {
      toast({ title: 'Configuration saved' })
      setEditDialog({ open: false })
      load()
    }
  }

  const activate = async (id: string) => {
    const res = await fetch(`/api/admin/integrations/${id}/activate`, { method: 'POST' })
    if (res.ok) {
      toast({ title: 'Provider activated', description: 'Other providers in this category have been deactivated.' })
      load()
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  const categories = ['PAYMENT', 'SMS', 'EMAIL'] as const
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = providers.filter((p) => p.category === cat)
    return acc
  }, {} as Record<string, Provider[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">Configure and activate API providers for payments, SMS, and email</p>
      </div>

      <Tabs defaultValue="PAYMENT">
        <TabsList>
          <TabsTrigger value="PAYMENT"><CreditCard className="mr-2 h-4 w-4" />Payment</TabsTrigger>
          <TabsTrigger value="SMS"><MessageSquare className="mr-2 h-4 w-4" />SMS</TabsTrigger>
          <TabsTrigger value="EMAIL"><Mail className="mr-2 h-4 w-4" />Email</TabsTrigger>
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {grouped[cat].map((p) => {
                const Icon = categoryIcons[p.category]
                return (
                  <Card key={p.id} className={p.isActive ? 'border-primary ring-1 ring-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        {p.isActive && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>}
                      </div>
                      <CardTitle className="mt-4">{p.name}</CardTitle>
                      <CardDescription>{p.description || p.provider}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        {p.testMode && <Badge variant="outline" className="text-xs">Test Mode</Badge>}
                        {Object.keys(p.config || {}).length > 0 && <Badge variant="outline" className="text-xs">Configured</Badge>}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Settings2 className="mr-2 h-4 w-4" />Configure
                        </Button>
                        {!p.isActive && (
                          <Button size="sm" onClick={() => activate(p.id)}>
                            <Power className="mr-2 h-4 w-4" />Activate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={editDialog.open} onOpenChange={(o) => setEditDialog({ ...editDialog, open: o })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {editDialog.provider?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editDialog.provider && Object.keys(editDialog.provider.config || {}).map((key) => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <Input
                  type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('key') ? 'password' : 'text'}
                  value={String(config[key] ?? '')}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Switch checked={testMode} onCheckedChange={setTestMode} />
              <Label>Test Mode (use sandbox credentials)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>Cancel</Button>
            <Button onClick={saveConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
