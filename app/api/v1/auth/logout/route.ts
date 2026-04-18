import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import {
  consumeRefreshToken,
  revokeRefreshFamily,
} from '@/lib/auth/tokens'
import { prisma } from '@/lib/db'
import { apiError, apiErrorFromZod, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const schema = z.object({
  refreshToken: z.string().min(10),
  deviceId: z.string().min(1).max(128).optional(),
})

/**
 * Log out a single device:
 *   - Revoke the entire refresh-token family tied to the supplied token.
 *   - Delete the Device row (unregisters the push token) if deviceId given.
 */
export const POST = withApiErrors(async (req: NextRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiErrorFromZod(parsed.error)

  const result = await consumeRefreshToken(parsed.data.refreshToken)
  if (result.ok) {
    await revokeRefreshFamily(result.familyId)
    if (parsed.data.deviceId) {
      await prisma.device
        .deleteMany({
          where: { userId: result.userId, deviceId: parsed.data.deviceId },
        })
        .catch(() => undefined)
    }
  }
  // Always respond 200 — logout is idempotent; don't leak whether token existed.
  return NextResponse.json({ ok: true })
})
