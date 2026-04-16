'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Milestone {
  id: string
  name: string
  status: string
}

interface Project {
  id: string
  name: string
  status: string
  startDate: string | null
  endDate: string | null
  company: { name: string }
  milestones: Milestone[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects || [])
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const getProgress = (milestones: Milestone[]) => {
    if (milestones.length === 0) return 0
    const completed = milestones.filter(m => m.status === 'COMPLETED').length
    return Math.round((completed / milestones.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Track the progress of your active projects
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {projects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No projects yet</p>
            </CardContent>
          </Card>
        )}
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.endDate ? `Due: ${new Date(project.endDate).toLocaleDateString()}` : 'No due date'}
                    </span>
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    project.status === 'IN_PROGRESS' ? 'default' : 'secondary'
                  }
                >
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getProgress(project.milestones)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${getProgress(project.milestones)}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div>
                <p className="mb-2 text-sm font-medium">Milestones</p>
                <div className="flex flex-wrap gap-2">
                  {project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                        milestone.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {milestone.status === 'COMPLETED' && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {milestone.name}
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href={`/portal/projects/${project.id}`}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
