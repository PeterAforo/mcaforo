import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'SUPPORT', 'PM', 'FINANCE']

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional().nullable(),
  password: z.string().min(6),
  companyId: z.string().optional().nullable(),
  roleIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAdminRole = session.roles?.some((role: string) =>
      ADMIN_ROLES.includes(role)
    )

    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
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

    // Only ADMIN can create users
    const isAdmin = session.roles?.includes('ADMIN')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        passwordHash,
        emailVerified: true, // Admin-created users are pre-verified
        status: 'ACTIVE',
        userRoles: data.roleIds?.length
          ? {
              create: data.roleIds.map((roleId) => ({
                roleId,
              })),
            }
          : undefined,
        companyUsers: data.companyId
          ? {
              create: {
                companyId: data.companyId,
                isPrimary: false,
              },
            }
          : undefined,
      },
      include: {
        userRoles: {
          include: { role: true },
        },
        companyUsers: {
          include: { company: true },
        },
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
