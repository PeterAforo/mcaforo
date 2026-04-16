import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  budget: z.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isStaff = session.roles.some((r) =>
      ['ADMIN', 'PM', 'SUPPORT'].includes(r)
    )

    let projects

    if (isStaff) {
      projects = await prisma.project.findMany({
        include: {
          company: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          milestones: {
            orderBy: { dueDate: 'asc' },
          },
          _count: {
            select: {
              milestones: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    } else {
      const userCompanies = await prisma.companyUser.findMany({
        where: { userId: session.id },
        select: { companyId: true },
      })
      const companyIds = userCompanies.map((uc) => uc.companyId)

      projects = await prisma.project.findMany({
        where: { companyId: { in: companyIds } },
        include: {
          company: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          milestones: {
            orderBy: { dueDate: 'asc' },
          },
          _count: {
            select: {
              milestones: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Failed to get projects' },
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

    const isStaff = session.roles.some((r) => ['ADMIN', 'PM'].includes(r))
    if (!isStaff) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const data = createProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        companyId: data.companyId,
        managerId: session.id,
        status: 'PLANNING',
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        company: true,
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
