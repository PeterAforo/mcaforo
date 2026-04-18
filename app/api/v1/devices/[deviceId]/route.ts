import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { resolveUser } from '@/lib/auth/resolve'
import { apiError, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

/** Unregister (delete) a device for the authenticated user. Idempotent. */
export const DELETE = withApiErrors(
  async (req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) => {
    const user = await resolveUser(req)
    if (!user) return apiError('UNAUTHORIZED', 'Not authenticated')

    const { deviceId } = await ctx.params
    if (!deviceId) return apiError('BAD_REQUEST', 'deviceId is required')

    await prisma.device.deleteMany({
      where: { userId: user.id, deviceId },
    })

    return NextResponse.json({ ok: true })
  }
)
