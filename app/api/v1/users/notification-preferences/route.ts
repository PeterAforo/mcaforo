import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { resolveUser } from '@/lib/auth/resolve'
import { apiError, apiErrorFromZod, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const KNOWN_TYPES = [
  'invoice.new',
  'invoice.paid',
  'ticket.reply',
  'ticket.status',
  'project.updated',
  'content.new',
  'chat.reply',
] as const

export const GET = withApiErrors(async (req: NextRequest) => {
  const user = await resolveUser(req)
  if (!user) return apiError('UNAUTHORIZED', 'Not authenticated')

  const rows = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  })
  const byType = new Map(rows.map((r) => [r.type, r]))
  const preferences = KNOWN_TYPES.map((type) => {
    const existing = byType.get(type)
    return {
      type,
      email: existing?.email ?? true,
      push: existing?.push ?? true,
      inApp: existing?.inApp ?? true,
    }
  })
  return NextResponse.json({ preferences })
})

const updateSchema = z.object({
  preferences: z.array(
    z.object({
      type: z.string().min(1).max(64),
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional(),
    })
  ).min(1),
})

export const PUT = withApiErrors(async (req: NextRequest) => {
  const user = await resolveUser(req)
  if (!user) return apiError('UNAUTHORIZED', 'Not authenticated')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body')
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiErrorFromZod(parsed.error)

  await prisma.$transaction(
    parsed.data.preferences.map((p) =>
      prisma.notificationPreference.upsert({
        where: { userId_type: { userId: user.id, type: p.type } },
        create: {
          userId: user.id,
          type: p.type,
          email: p.email ?? true,
          push: p.push ?? true,
          inApp: p.inApp ?? true,
        },
        update: {
          ...(p.email !== undefined ? { email: p.email } : {}),
          ...(p.push !== undefined ? { push: p.push } : {}),
          ...(p.inApp !== undefined ? { inApp: p.inApp } : {}),
        },
      })
    )
  )

  return NextResponse.json({ ok: true })
})
