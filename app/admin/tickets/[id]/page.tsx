'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, User, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  content: string
  isInternal: boolean
  createdAt: string
  user: { firstName: string; lastName: string }
}

interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  company: { name: string }
  creator: { firstName: string; lastName: string; email: string }
  assignee: { id: string; firstName: string; lastName: string } | null
  messages: Message[]
}

interface StaffUser {
  id: string
  firstName: string
  lastName: string
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_ON_CLIENT: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketRes, usersRes] = await Promise.all([
          fetch(`/api/tickets/${params.id}`),
          fetch('/api/admin/users'),
        ])
        
        if (ticketRes.ok) {
          const data = await ticketRes.json()
          setTicket(data.ticket)
        }
        
        if (usersRes.ok) {
          const data = await usersRes.json()
          // Filter to only staff users
          const staff = data.users?.filter((u: any) => 
            u.userRoles?.some((ur: any) => 
              ['ADMIN', 'SUPPORT', 'PM'].includes(ur.role.name)
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !ticket) return

    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isInternal,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTicket({
          ...ticket,
          messages: [...ticket.messages, data.message],
        })
        setReplyContent('')
        toast({ title: 'Reply sent' })
      } else {
        throw new Error('Failed to send reply')
      }
    } catch (error) {
      toast({ title: 'Failed to send reply', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleUpdateTicket = async (field: string, value: string) => {
    if (!ticket) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (res.ok) {
        const data = await res.json()
        setTicket(data.ticket)
        toast({ title: `Ticket ${field} updated` })
      } else {
        throw new Error('Failed to update ticket')
      }
    } catch (error) {
      toast({ title: 'Failed to update ticket', variant: 'destructive' })
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

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-muted-foreground">
            {ticket.company?.name || 'No Company'} • {ticket.creator?.firstName} {ticket.creator?.lastName}
          </p>
        </div>
        <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
        <Badge className={statusColors[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Original Description */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Original Request</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-4">
            {ticket.messages.map((message) => (
              <Card key={message.id} className={message.isInternal ? 'border-yellow-200 bg-yellow-50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                      {message.user.firstName[0]}{message.user.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {message.user.firstName} {message.user.lastName}
                        </span>
                        {message.isInternal && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Internal Note
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReply} className="space-y-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Internal note (not visible to client)
                  </label>
                  <Button type="submit" disabled={sending || !replyContent.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </form>
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
                value={ticket.status}
                onValueChange={(value) => handleUpdateTicket('status', value)}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING_ON_CLIENT">Waiting on Client</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={ticket.priority}
                onValueChange={(value) => handleUpdateTicket('priority', value)}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assignee</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={ticket.assignee?.id || 'unassigned'}
                onValueChange={(value) => handleUpdateTicket('assigneeId', value === 'unassigned' ? '' : value)}
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
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{ticket.creator.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span> {ticket.category}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
