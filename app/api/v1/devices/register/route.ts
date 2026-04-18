import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { resolveUser } from '@/lib/auth/resolve'
import { apiError, apiErrorFromZod, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const schema = z.object({
  deviceId: z.string().min(1).max(128),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  pushToken: z.string().max(512).optional().nullable(),
  appVersion: z.string().max(32).optional().nullable(),
  osVersion: z.string().max(32).optional().nullable(),
  model: z.string().max(128).optional().nullable(),
  locale: z.string().max(32).optional().nullable(),
})

/**
 * Register (or update) a device + its push token for the authenticated user.
 * Unique per (userId, deviceId); re-registering updates push token / metadata.
 */
export const POST = withApiErrors(async (req: NextRequest) => {
  const user = await resolveUser(req)
  if (!user) return apiError('UNAUTHORIZED', 'Not authenticated')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiErrorFromZod(parsed.error)
  const data = parsed.data

  const device = await prisma.device.upsert({
    where: { userId_deviceId: { userId: user.id, deviceId: data.deviceId } },
    update: {
      platform: data.platform,
      pushToken: data.pushToken ?? null,
      appVersion: data.appVersion ?? null,
      osVersion: data.osVersion ?? null,
      model: data.model ?? null,
      locale: data.locale ?? null,
      lastSeenAt: new Date(),
    },
    create: {
      userId: user.id,
      deviceId: data.deviceId,
      platform: data.platform,
      pushToken: data.pushToken ?? null,
      appVersion: data.appVersion ?? null,
      osVersion: data.osVersion ?? null,
      model: data.model ?? null,
      locale: data.locale ?? null,
    },
  })

  return NextResponse.json({ ok: true, device: { id: device.id, deviceId: device.deviceId } })
})
