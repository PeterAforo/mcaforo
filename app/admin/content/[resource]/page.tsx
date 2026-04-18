'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Loader2, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'

interface Item { id: string; [k: string]: unknown }
interface ListConfig { label: string; labelSingular: string; primaryField: string; secondaryField?: string }

export default function ResourceListPage(props: { params: Promise<{ resource: string }> }) {
  const { resource } = use(props.params)
  const { toast } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [config, setConfig] = useState<ListConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/content/${resource}${qs}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      const data = await res.json()
      setItems(data.items)
      setConfig(data.config)
    } catch (err) {
      toast({ title: 'Load failed', description: String(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [resource])

  const del = async (id: string) => {
    if (!window.confirm('Delete this item?')) return
    const res = await fetch(`/api/admin/content/${resource}/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Deleted' }); load() }
    else toast({ title: 'Delete failed', variant: 'destructive' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{config?.label ?? resource}</h1>
          <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
        </div>
        <Button asChild>
          <Link href={`/admin/content/${resource}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New {config?.labelSingular ?? 'item'}
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={load}>Search</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{config?.primaryField ?? 'Name'}</TableHead>
                  {config?.secondaryField && <TableHead>{config.secondaryField}</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const primary = item[config?.primaryField ?? 'title'] as string | undefined
                  const secondary = config?.secondaryField ? String(item[config.secondaryField] ?? '') : null
                  const status = (item.status as string | undefined) ?? ((item.isActive as boolean | undefined) === false ? 'INACTIVE' : 'ACTIVE')
                  const updated = item.updatedAt as string | undefined
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-md truncate">{primary ?? item.id}</TableCell>
                      {config?.secondaryField && <TableCell className="text-sm text-muted-foreground">{secondary}</TableCell>}
                      <TableCell><Badge variant={status === 'PUBLISHED' || status === 'ACTIVE' ? 'default' : 'secondary'}>{status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{updated ? new Date(updated).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/content/${resource}/${item.id}`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {items.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
