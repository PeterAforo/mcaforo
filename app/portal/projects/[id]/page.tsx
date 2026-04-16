'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

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
  company: {
    name: string
  }
  manager: {
    firstName: string
    lastName: string
  } | null
  milestones: Milestone[]
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

const milestoneStatusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  IN_PROGRESS: <AlertCircle className="h-4 w-4" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  DELAYED: <AlertCircle className="h-4 w-4" />,
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Project not found')
          } else {
            setError('Failed to load project')
          }
          return
        }
        const data = await res.json()
        setProject(data.project)
      } catch (err) {
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{error || 'Project not found'}</p>
            <Button className="mt-4" onClick={() => router.push('/portal/projects')}>
              View All Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length
  const totalMilestones = project.milestones.length
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.company.name}</p>
        </div>
        <Badge className={statusColors[project.status] || 'bg-gray-100'}>
          {project.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{completedMilestones} of {totalMilestones} milestones</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                {' - '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Project Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {project.manager 
                ? `${project.manager.firstName} ${project.manager.lastName}`
                : 'Not assigned'}
            </p>
          </CardContent>
        </Card>
      </div>

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Track project progress through milestones</CardDescription>
        </CardHeader>
        <CardContent>
          {project.milestones.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No milestones yet</p>
          ) : (
            <div className="space-y-4">
              {project.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  <div className={`p-2 rounded-full ${milestoneStatusColors[milestone.status] || 'bg-gray-100'}`}>
                    {milestoneStatusIcons[milestone.status]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{milestone.name}</h4>
                      <Badge variant="outline" className={milestoneStatusColors[milestone.status]}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
