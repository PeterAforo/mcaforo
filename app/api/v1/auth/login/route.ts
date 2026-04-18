import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { createAccessToken, issueRefreshToken, ACCESS_TOKEN_TTL_SECONDS } from '@/lib/auth/tokens'
import { apiError, apiErrorFromZod, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().min(1).max(128).optional(),
})

/**
 * Mobile-compatible login. Always returns bearer + refresh tokens.
 * (The web app continues to use /api/auth/login which sets a cookie.)
 */
export const POST = withApiErrors(async (req: NextRequest) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body')
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return apiErrorFromZod(parsed.error)
  const { email, password, deviceId } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  })
  if (!user) return apiError('UNAUTHORIZED', 'Invalid email or password')
  if (!user.emailVerified) return apiError('UNAUTHORIZED', 'Email not verified')
  if (user.status !== 'ACTIVE') return apiError('FORBIDDEN', 'Account is not active')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return apiError('UNAUTHORIZED', 'Invalid email or password')

  const sessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.userRoles.map((ur) => ur.role.name),
  }

  const accessToken = await createAccessToken(sessionUser)
  const refresh = await issueRefreshToken({
    userId: user.id,
    deviceId: deviceId ?? null,
    userAgent: req.headers.get('user-agent'),
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  return NextResponse.json({
    accessToken,
    refreshToken: refresh.plaintext,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    tokenType: 'Bearer',
    user: sessionUser,
  })
})
