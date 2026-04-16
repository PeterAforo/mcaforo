import { Metadata } from 'next'
import Link from 'next/link'
import {
  FolderKanban,
  Ticket,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Dashboard | McAforo Portal',
  description: 'Manage your projects, tickets, and billing',
}

const stats = [
  {
    title: 'Active Projects',
    value: '3',
    icon: FolderKanban,
    href: '/portal/projects',
  },
  {
    title: 'Open Tickets',
    value: '2',
    icon: Ticket,
    href: '/portal/tickets',
  },
  {
    title: 'Pending Invoices',
    value: '1',
    icon: FileText,
    href: '/portal/invoices',
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'ticket',
    title: 'Website bug fix completed',
    time: '2 hours ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'project',
    title: 'New milestone reached: Design Phase',
    time: '1 day ago',
    status: 'in_progress',
  },
  {
    id: 3,
    type: 'invoice',
    title: 'Invoice #INV-2024-001 paid',
    time: '3 days ago',
    status: 'paid',
  },
]

export default function PortalDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <Link
                href={stat.href}
                className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {activity.type === 'ticket' && (
                      <Ticket className="h-5 w-5 text-muted-foreground" />
                    )}
                    {activity.type === 'project' && (
                      <FolderKanban className="h-5 w-5 text-muted-foreground" />
                    )}
                    {activity.type === 'invoice' && (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    activity.status === 'completed' || activity.status === 'paid'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {activity.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/portal/tickets/new">Create Support Ticket</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portal/invoices">View Invoices</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
