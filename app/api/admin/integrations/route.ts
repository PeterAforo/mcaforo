import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const providers = await prisma.integrationProvider.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json({ providers })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const provider = await prisma.integrationProvider.create({
      data: {
        category: body.category,
        provider: body.provider,
        name: body.name,
        description: body.description || null,
        config: body.config || {},
        isActive: body.isActive ?? false,
        testMode: body.testMode ?? true,
      },
    })
    return NextResponse.json({ provider }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create provider'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
