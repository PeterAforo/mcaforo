import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message is required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content } = createMessageSchema.parse(body)

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access
    const isStaff = session.roles.some((r) =>
      ['ADMIN', 'SUPPORT', 'PM'].includes(r)
    )
    if (!isStaff && ticket.creatorId !== session.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: session.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Update ticket status if staff is replying
    if (isStaff && ticket.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    // Notify the other party
    const isCreator = session.id === ticket.creatorId
    const recipientEmail = isCreator
      ? ticket.assignee?.email
      : ticket.creator.email
    const recipientName = isCreator
      ? ticket.assignee?.firstName
      : ticket.creator.firstName

    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: `New Reply on Ticket ${ticket.id}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #0f172a;">New Reply</h1>
              <p>Hi ${recipientName},</p>
              <p>There's a new reply on ticket ${ticket.id}:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${session.firstName} ${session.lastName}</p>
                <p>${content}</p>
              </div>
              <p>Log in to your portal to respond.</p>
            </body>
          </html>
        `,
      })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
