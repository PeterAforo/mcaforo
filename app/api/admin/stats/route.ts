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

    // Check if user has admin role
    const hasAdminRole = session.roles?.some((role: string) =>
      ADMIN_ROLES.includes(role)
    )

    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get stats in parallel
    const [
      totalCompanies,
      totalUsers,
      activeProjects,
      openTickets,
      pendingInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.project.count({
        where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } },
      }),
      prisma.ticket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT'] } },
      }),
      prisma.invoice.count({
        where: { status: { in: ['SENT', 'OVERDUE'] } },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { total: true },
      }),
    ])

    return NextResponse.json({
      totalCompanies,
      totalUsers,
      activeProjects,
      openTickets,
      pendingInvoices,
      monthlyRevenue: Number(monthlyRevenue._sum.total || 0),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
