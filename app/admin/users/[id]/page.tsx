'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Shield, Building2, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface Role {
  id: string
  name: string
}

interface UserRole {
  id: string
  role: Role
}

interface CompanyUser {
  id: string
  company: { id: string; name: string }
  isPrimary: boolean
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  status: string
  emailVerified: boolean
  createdAt: string
  userRoles: UserRole[]
  companyUsers: CompanyUser[]
}

const ALL_ROLES = ['CLIENT_USER', 'CLIENT_ADMIN', 'SUPPORT', 'PM', 'FINANCE', 'ADMIN']

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800',
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, rolesRes] = await Promise.all([
          fetch(`/api/admin/users/${params.id}`),
          fetch('/api/admin/roles'),
        ])
        
        if (userRes.ok) {
          const data = await userRes.json()
          setUser(data.user)
          setSelectedRoles(data.user.userRoles.map((ur: UserRole) => ur.role.id))
        }
        
        if (rolesRes.ok) {
          const data = await rolesRes.json()
          setAllRoles(data.roles || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const handleUpdateStatus = async (status: string) => {
    if (!user) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        setUser({ ...user, status })
        toast({ title: 'User status updated' })
      } else {
        throw new Error('Failed to update user')
      }
    } catch (error) {
      toast({ title: 'Failed to update user', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleRole = async (roleId: string, checked: boolean) => {
    if (!user) return
    setUpdating(true)
    
    const newRoles = checked 
      ? [...selectedRoles, roleId]
      : selectedRoles.filter(id => id !== roleId)
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: newRoles }),
      })

      if (res.ok) {
        setSelectedRoles(newRoles)
        const data = await res.json()
        setUser({ ...user, userRoles: data.userRoles })
        toast({ title: 'User roles updated' })
      } else {
        throw new Error('Failed to update roles')
      }
    } catch (error) {
      toast({ title: 'Failed to update roles', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified
                    </Badge>
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleToggleRole(role.id, checked as boolean)}
                      disabled={updating}
                    />
                    <Label htmlFor={role.id} className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      {role.name.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Companies */}
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {user.companyUsers?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No company associations</p>
              ) : (
                <div className="space-y-2">
                  {user.companyUsers?.map((cu) => (
                    <div key={cu.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/admin/companies/${cu.company.id}`} className="hover:text-primary">
                          {cu.company.name}
                        </Link>
                      </div>
                      {cu.isPrimary && (
                        <Badge variant="outline">Primary Contact</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={user.status}
                onValueChange={handleUpdateStatus}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.userRoles.map((ur) => (
                  <Badge key={ur.id} variant="secondary">
                    {ur.role.name.replace('_', ' ')}
                  </Badge>
                ))}
                {user.userRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No roles assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge className={statusColors[user.status]}>{user.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verified</span>
                <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                  {user.emailVerified ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
