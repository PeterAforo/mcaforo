import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  dueDate: z.string().transform((val) => new Date(val)),
  deliverables: z.array(z.string()).optional(),
})

const updateMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().transform((val) => new Date(val)).optional(),
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

    const isStaff = session.roles.some((r) => ['ADMIN', 'PM'].includes(r))
    if (!isStaff) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = createMilestoneSchema.parse(body)

    const milestone = await prisma.milestone.create({
      data: {
        projectId: id,
        name: data.name,
        description: data.description,
        dueDate: data.dueDate,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ milestone }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create milestone error:', error)
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isStaff = session.roles.some((r) => ['ADMIN', 'PM'].includes(r))
    if (!isStaff) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { milestoneId, ...data } = updateMilestoneSchema.parse(body)

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...data,
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        project: {
          include: {
            company: {
              include: {
                companyUsers: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Notify client when milestone is completed
    if (data.status === 'COMPLETED') {
      const users = milestone.project.company.companyUsers.map((cu) => cu.user)
      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `Milestone Completed: ${milestone.name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0f172a;">Milestone Completed! 🎉</h1>
                <p>Hi ${user.firstName},</p>
                <p>Great news! A milestone has been completed on your project:</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Project:</strong> ${milestone.project.name}</p>
                  <p><strong>Milestone:</strong> ${milestone.name}</p>
                </div>
                <p>Log in to your portal to view the details.</p>
              </body>
            </html>
          `,
        })
      }
    }

    return NextResponse.json({ milestone })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Update milestone error:', error)
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}
