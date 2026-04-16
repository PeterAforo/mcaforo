'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface Milestone {
  id: string
  name: string
  description: string | null
  status: string
  dueDate: string | null
  completedAt: string | null
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  company: { id: string; name: string }
  manager: { id: string; firstName: string; lastName: string } | null
  milestones: Milestone[]
}

interface StaffUser {
  id: string
  firstName: string
  lastName: string
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const milestoneStatusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DELAYED: 'bg-red-100 text-red-800',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    dueDate: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, usersRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch('/api/admin/users'),
        ])
        
        if (projectRes.ok) {
          const data = await projectRes.json()
          setProject(data.project)
        }
        
        if (usersRes.ok) {
          const data = await usersRes.json()
          const staff = data.users?.filter((u: any) => 
            u.userRoles?.some((ur: any) => 
              ['ADMIN', 'PM'].includes(ur.role.name)
            )
          ) || []
          setStaffUsers(staff)
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

  const handleUpdateProject = async (field: string, value: string) => {
    if (!project) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
        toast({ title: 'Project updated' })
      } else {
        throw new Error('Failed to update project')
      }
    } catch (error) {
      toast({ title: 'Failed to update project', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !newMilestone.name) return

    try {
      const res = await fetch(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMilestone.name,
          description: newMilestone.description || null,
          dueDate: newMilestone.dueDate || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setProject({
          ...project,
          milestones: [...project.milestones, data.milestone],
        })
        setNewMilestone({ name: '', description: '', dueDate: '' })
        setMilestoneDialogOpen(false)
        toast({ title: 'Milestone added' })
      } else {
        throw new Error('Failed to add milestone')
      }
    } catch (error) {
      toast({ title: 'Failed to add milestone', variant: 'destructive' })
    }
  }

  const handleUpdateMilestoneStatus = async (milestoneId: string, status: string) => {
    if (!project) return

    try {
      const res = await fetch(`/api/projects/${project.id}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          status,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setProject({
          ...project,
          milestones: project.milestones.map(m => 
            m.id === milestoneId ? data.milestone : m
          ),
        })
        toast({ title: 'Milestone updated' })
      } else {
        throw new Error('Failed to update milestone')
      }
    } catch (error) {
      toast({ title: 'Failed to update milestone', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Project not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length
  const progress = project.milestones.length > 0 
    ? (completedMilestones / project.milestones.length) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.company.name}</p>
          </div>
        </div>
        <Badge className={statusColors[project.status]}>{project.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{completedMilestones} of {project.milestones.length} milestones completed</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Milestones</CardTitle>
                <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Milestone</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMilestone} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={newMilestone.name}
                          onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                          placeholder="Milestone name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newMilestone.description}
                          onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newMilestone.dueDate}
                          onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full">Add Milestone</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {project.milestones.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No milestones yet</p>
              ) : (
                <div className="space-y-4">
                  {project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className={`p-2 rounded-full ${milestoneStatusColors[milestone.status]}`}>
                        {milestone.status === 'COMPLETED' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : milestone.status === 'IN_PROGRESS' ? (
                          <Clock className="h-4 w-4" />
                        ) : milestone.status === 'DELAYED' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{milestone.name}</h4>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {milestone.dueDate && (
                            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          )}
                          {milestone.completedAt && (
                            <span className="text-green-600">
                              Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Select
                        value={milestone.status}
                        onValueChange={(value) => handleUpdateMilestoneStatus(milestone.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="DELAYED">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={project.status}
                onValueChange={(value) => handleUpdateProject('status', value)}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={project.manager?.id || 'unassigned'}
                onValueChange={(value) => handleUpdateProject('managerId', value === 'unassigned' ? '' : value)}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Start Date:</span>{' '}
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
              </div>
              <div>
                <span className="text-muted-foreground">End Date:</span>{' '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
