import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { priceMin: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: 'Failed to get services' },
      { status: 500 }
    )
  }
}
