import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'SUPPORT', 'PM', 'FINANCE']

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

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Get roles error:', error)
    return NextResponse.json(
      { error: 'Failed to get roles' },
      { status: 500 }
    )
  }
}
