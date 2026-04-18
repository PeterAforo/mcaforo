import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import {
  consumeRefreshToken,
  issueRefreshToken,
  revokeRefreshTokenById,
  createAccessToken,
  ACCESS_TOKEN_TTL_SECONDS,
} from '@/lib/auth/tokens'
import { apiError, apiErrorFromZod, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const schema = z.object({
  refreshToken: z.string().min(10),
  deviceId: z.string().min(1).max(128).optional(),
})

/**
 * Rotating refresh-token exchange.
 *   - Consumes old refresh token (revokes it on success).
 *   - Issues a fresh access + refresh pair, preserving the family id.
 *   - On reuse of an already-revoked token, the entire family is revoked
 *     (handled inside consumeRefreshToken).
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
  if (!result.ok) {
    const msg =
      result.reason === 'REUSED'
        ? 'Refresh token reuse detected; all sessions revoked'
        : 'Invalid or expired refresh token'
    return apiError('UNAUTHORIZED', msg)
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    include: { userRoles: { include: { role: true } } },
  })
  if (!user || user.status !== 'ACTIVE') {
    await revokeRefreshTokenById(result.rotatedFromId)
    return apiError('UNAUTHORIZED', 'Account no longer active')
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.userRoles.map((ur) => ur.role.name),
  }

  // Revoke the consumed token, then issue a new one in the same family.
  await revokeRefreshTokenById(result.rotatedFromId)
  const accessToken = await createAccessToken(sessionUser)
  const next = await issueRefreshToken({
    userId: user.id,
    familyId: result.familyId,
    rotatedFromId: result.rotatedFromId,
    deviceId: parsed.data.deviceId ?? null,
    userAgent: req.headers.get('user-agent'),
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  return NextResponse.json({
    accessToken,
    refreshToken: next.plaintext,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    tokenType: 'Bearer',
  })
})
