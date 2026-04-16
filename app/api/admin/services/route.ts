import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'PM']

const createServiceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAdminRole = session.roles?.some((role: string) => ADMIN_ROLES.includes(role))
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const services = await prisma.service.findMany({
      include: {
        plans: {
          orderBy: { priceMin: 'asc' },
        },
        addOns: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            plans: true,
            addOns: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'Failed to get services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAdminRole = session.roles?.some((role: string) => ADMIN_ROLES.includes(role))
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createServiceSchema.parse(body)

    // Check if slug already exists
    const existingService = await prisma.service.findUnique({
      where: { slug: data.slug },
    })

    if (existingService) {
      return NextResponse.json({ error: 'A service with this slug already exists' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive,
      },
      include: {
        plans: true,
        addOns: true,
      },
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create service error:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
