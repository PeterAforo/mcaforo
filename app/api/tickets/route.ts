import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  projectId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const isStaff = session.roles.some((r) =>
      ['ADMIN', 'SUPPORT', 'PM'].includes(r)
    )

    const whereClause = isStaff
      ? status
        ? { status: status as any }
        : {}
      : {
          creatorId: session.id,
          ...(status ? { status: status as any } : {}),
        }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
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
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: 'Failed to get tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createTicketSchema.parse(body)

    // Get user's company
    const userCompany = await prisma.companyUser.findFirst({
      where: { userId: session.id },
    })

    if (!userCompany) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 400 }
      )
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject: data.subject,
        description: data.message,
        category: 'general',
        priority: data.priority,
        status: 'OPEN',
        creatorId: session.id,
        companyId: userCompany.companyId,
        messages: {
          create: {
            content: data.message,
            userId: session.id,
          },
        },
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Notify support team
    const supportUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: { in: ['ADMIN', 'SUPPORT'] },
            },
          },
        },
      },
    })

    for (const supportUser of supportUsers) {
      await sendEmail({
        to: supportUser.email,
        subject: `New Support Ticket: ${ticket.id}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #0f172a;">New Support Ticket</h1>
              <p>A new support ticket has been created:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Ticket:</strong> ${ticket.id}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>From:</strong> ${ticket.creator.firstName} ${ticket.creator.lastName}</p>
              </div>
              <p>Log in to the admin portal to respond.</p>
            </body>
          </html>
        `,
      })
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
