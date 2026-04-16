'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Edit, Package, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Plan {
  id: string
  name: string
  description: string | null
  priceMin: number
  priceMax: number
  productType: string
  billingCycle: string | null
  features: string[]
  isActive: boolean
}

interface AddOn {
  id: string
  name: string
  description: string | null
  price: number
  isActive: boolean
}

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  plans: Plan[]
  addOns: AddOn[]
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  })

  // Plan form state
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    priceMin: 0,
    priceMax: 0,
    productType: 'RECURRING',
    billingCycle: 'MONTHLY',
    features: '',
    isActive: true,
  })

  // Add-on form state
  const [addonDialogOpen, setAddonDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null)
  const [addonForm, setAddonForm] = useState({
    name: '',
    description: '',
    price: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchService()
  }, [params.id])

  async function fetchService() {
    try {
      const res = await fetch(`/api/admin/services/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setService(data.service)
        setFormData({
          name: data.service.name,
          slug: data.service.slug,
          description: data.service.description || '',
          isActive: data.service.isActive,
        })
      } else {
        router.push('/admin/services')
      }
    } catch (error) {
      console.error('Failed to fetch service:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveService() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/services/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({ title: 'Service updated successfully' })
        fetchService()
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to update service',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteService() {
    try {
      const res = await fetch(`/api/admin/services/${params.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Service deleted successfully' })
        router.push('/admin/services')
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to delete service',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  // Plan handlers
  function openPlanDialog(plan?: Plan) {
    if (plan) {
      setEditingPlan(plan)
      setPlanForm({
        name: plan.name,
        description: plan.description || '',
        priceMin: Number(plan.priceMin),
        priceMax: Number(plan.priceMax),
        productType: plan.productType,
        billingCycle: plan.billingCycle || 'MONTHLY',
        features: plan.features.join('\n'),
        isActive: plan.isActive,
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        name: '',
        description: '',
        priceMin: 0,
        priceMax: 0,
        productType: 'RECURRING',
        billingCycle: 'MONTHLY',
        features: '',
        isActive: true,
      })
    }
    setPlanDialogOpen(true)
  }

  async function handleSavePlan() {
    const features = planForm.features.split('\n').filter(f => f.trim())
    const data = {
      name: planForm.name,
      description: planForm.description || null,
      priceMin: planForm.priceMin,
      priceMax: planForm.priceMax,
      productType: planForm.productType,
      billingCycle: planForm.productType === 'RECURRING' ? planForm.billingCycle : null,
      features,
      isActive: planForm.isActive,
    }

    try {
      const url = editingPlan
        ? `/api/admin/services/${params.id}/plans/${editingPlan.id}`
        : `/api/admin/services/${params.id}/plans`
      const method = editingPlan ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast({ title: editingPlan ? 'Plan updated' : 'Plan created' })
        setPlanDialogOpen(false)
        fetchService()
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to save plan',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  async function handleDeletePlan(planId: string) {
    try {
      const res = await fetch(`/api/admin/services/${params.id}/plans/${planId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Plan deleted' })
        fetchService()
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to delete plan',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  // Add-on handlers
  function openAddonDialog(addon?: AddOn) {
    if (addon) {
      setEditingAddon(addon)
      setAddonForm({
        name: addon.name,
        description: addon.description || '',
        price: Number(addon.price),
        isActive: addon.isActive,
      })
    } else {
      setEditingAddon(null)
      setAddonForm({
        name: '',
        description: '',
        price: 0,
        isActive: true,
      })
    }
    setAddonDialogOpen(true)
  }

  async function handleSaveAddon() {
    const data = {
      name: addonForm.name,
      description: addonForm.description || null,
      price: addonForm.price,
      isActive: addonForm.isActive,
    }

    try {
      const url = editingAddon
        ? `/api/admin/services/${params.id}/addons/${editingAddon.id}`
        : `/api/admin/services/${params.id}/addons`
      const method = editingAddon ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast({ title: editingAddon ? 'Add-on updated' : 'Add-on created' })
        setAddonDialogOpen(false)
        fetchService()
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to save add-on',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteAddon(addonId: string) {
    try {
      const res = await fetch(`/api/admin/services/${params.id}/addons/${addonId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Add-on deleted' })
        fetchService()
      } else {
        const error = await res.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to delete add-on',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground">/services/{service.slug}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Service
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this service and all its plans and add-ons.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteService} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Service Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <Button onClick={handleSaveService} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Plans */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pricing Plans
              </CardTitle>
              <CardDescription>Define pricing tiers for this service</CardDescription>
            </div>
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => openPlanDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plan Name *</Label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g., Basic, Pro, Enterprise"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Brief description of this plan"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Price (GHS)</Label>
                      <Input
                        type="number"
                        value={planForm.priceMin}
                        onChange={(e) => setPlanForm({ ...planForm, priceMin: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Price (GHS)</Label>
                      <Input
                        type="number"
                        value={planForm.priceMax}
                        onChange={(e) => setPlanForm({ ...planForm, priceMax: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Type</Label>
                      <Select
                        value={planForm.productType}
                        onValueChange={(value) => setPlanForm({ ...planForm, productType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECURRING">Recurring</SelectItem>
                          <SelectItem value="ONE_TIME">One-Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {planForm.productType === 'RECURRING' && (
                      <div className="space-y-2">
                        <Label>Billing Cycle</Label>
                        <Select
                          value={planForm.billingCycle}
                          onValueChange={(value) => setPlanForm({ ...planForm, billingCycle: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={planForm.features}
                      onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={planForm.isActive}
                      onCheckedChange={(checked) => setPlanForm({ ...planForm, isActive: checked })}
                    />
                  </div>
                  <Button onClick={handleSavePlan} className="w-full">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {service.plans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No plans yet. Add your first pricing plan.
              </p>
            ) : (
              <div className="space-y-3">
                {service.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{plan.productType}</Badge>
                        {plan.billingCycle && (
                          <Badge variant="outline">{plan.billingCycle}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        GHS {Number(plan.priceMin).toLocaleString()} - GHS {Number(plan.priceMax).toLocaleString()}
                      </p>
                      {plan.features.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.features.length} features
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openPlanDialog(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this plan. Active subscriptions will be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePlan(plan.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add-ons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Add-ons
            </CardTitle>
            <CardDescription>Optional extras clients can add to their subscription</CardDescription>
          </div>
          <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openAddonDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Add-on
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAddon ? 'Edit Add-on' : 'Add Add-on'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={addonForm.name}
                    onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                    placeholder="e.g., Priority Support"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={addonForm.description}
                    onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (GHS)</Label>
                  <Input
                    type="number"
                    value={addonForm.price}
                    onChange={(e) => setAddonForm({ ...addonForm, price: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={addonForm.isActive}
                    onCheckedChange={(checked) => setAddonForm({ ...addonForm, isActive: checked })}
                  />
                </div>
                <Button onClick={handleSaveAddon} className="w-full">
                  {editingAddon ? 'Update Add-on' : 'Create Add-on'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {service.addOns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No add-ons yet. Add optional extras for this service.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {service.addOns.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{addon.name}</span>
                      <Badge variant={addon.isActive ? 'default' : 'secondary'}>
                        {addon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      GHS {Number(addon.price).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openAddonDialog(addon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Add-on?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this add-on.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAddon(addon.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
