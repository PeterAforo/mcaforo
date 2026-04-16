import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Clock, MessageSquare } from 'lucide-react'

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
  title: 'Support Tickets | McAforo Portal',
  description: 'View and manage your support tickets',
}

const tickets = [
  {
    id: 'TKT-001',
    subject: 'Website loading slowly on mobile',
    status: 'open',
    priority: 'high',
    createdAt: '2024-02-10',
    lastUpdate: '2 hours ago',
    messages: 3,
  },
  {
    id: 'TKT-002',
    subject: 'Need help with email configuration',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-02-08',
    lastUpdate: '1 day ago',
    messages: 5,
  },
  {
    id: 'TKT-003',
    subject: 'Feature request: Dark mode',
    status: 'closed',
    priority: 'low',
    createdAt: '2024-01-25',
    lastUpdate: '1 week ago',
    messages: 8,
  },
]

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const statusColors = {
  open: 'default',
  in_progress: 'secondary',
  closed: 'outline',
} as const

export default function TicketsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="mt-1 text-muted-foreground">
            Get help from our support team
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardDescription>{ticket.id}</CardDescription>
                  <CardTitle className="mt-1 text-lg">
                    {ticket.subject}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      priorityColors[ticket.priority as keyof typeof priorityColors]
                    }`}
                  >
                    {ticket.priority}
                  </span>
                  <Badge variant={statusColors[ticket.status as keyof typeof statusColors]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {ticket.lastUpdate}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {ticket.messages} messages
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/portal/tickets/${ticket.id}`}>View Ticket</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
