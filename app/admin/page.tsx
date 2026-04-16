'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Building2,
  FolderKanban,
  Ticket,
  FileText,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardStats {
  totalCompanies: number
  totalUsers: number
  activeProjects: number
  openTickets: number
  pendingInvoices: number
  monthlyRevenue: number
}

interface RecentTicket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  company: { name: string }
}

interface RecentProject {
  id: string
  name: string
  status: string
  company: { name: string }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalUsers: 0,
    activeProjects: 0,
    openTickets: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  })
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, ticketsRes, projectsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/tickets?limit=5'),
          fetch('/api/projects?limit=5'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json()
          setRecentTickets(ticketsData.tickets || [])
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setRecentProjects(projectsData.projects || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      href: '/admin/companies',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      href: '/admin/users',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderKanban,
      href: '/admin/projects',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: Ticket,
      href: '/admin/tickets',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: FileText,
      href: '/admin/invoices',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Monthly Revenue',
      value: `GHS ${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      href: '/admin/payments',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ]

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    WAITING_ON_CLIENT: 'bg-purple-100 text-purple-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    PLANNING: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your business operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Link
                href={stat.href}
                className="text-sm text-primary hover:underline inline-flex items-center mt-2"
              >
                View all
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Latest support requests</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/tickets">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tickets yet</p>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="font-medium hover:text-primary truncate block"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {ticket.company?.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={statusColors[ticket.status] || 'bg-gray-100'}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Active client projects</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/projects">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="font-medium hover:text-primary truncate block"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {project.company?.name}
                      </p>
                    </div>
                    <Badge className={statusColors[project.status] || 'bg-gray-100'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
