import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

import { prisma } from '@/lib/db'
import type { SessionUser } from '@/lib/auth'

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'your-secret-key-change-in-production'
)

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface AccessTokenClaims extends SessionUser {
  type: 'access'
}

/** Signed, short-lived JWT used as `Authorization: Bearer` on mobile. */
export async function createAccessToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(JWT_SECRET)
}

export async function verifyAccessToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if ((payload as any).type && (payload as any).type !== 'access') return null
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

/** Opaque random refresh token (returned to the client, never stored plaintext). */
export function generateRefreshTokenPlaintext(): string {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashRefreshToken(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

export interface IssueRefreshTokenInput {
  userId: string
  deviceId?: string | null
  familyId?: string
  rotatedFromId?: string | null
  userAgent?: string | null
  ipAddress?: string | null
}

/**
 * Persist a hashed refresh token and return the plaintext value + DB id.
 * Plaintext MUST only ever be returned to the client and is NEVER stored.
 */
export async function issueRefreshToken(input: IssueRefreshTokenInput) {
  const plaintext = generateRefreshTokenPlaintext()
  const tokenHash = hashRefreshToken(plaintext)
  const familyId = input.familyId ?? crypto.randomUUID()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)

  const row = await prisma.refreshToken.create({
    data: {
      userId: input.userId,
      tokenHash,
      deviceId: input.deviceId ?? null,
      familyId,
      rotatedFromId: input.rotatedFromId ?? null,
      expiresAt,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
    },
  })

  return { id: row.id, familyId: row.familyId, plaintext, expiresAt }
}

export type RefreshResult =
  | { ok: true; userId: string; familyId: string; rotatedFromId: string }
  | { ok: false; reason: 'NOT_FOUND' | 'EXPIRED' | 'REVOKED' | 'REUSED' }

/**
 * Validate an incoming refresh token. On reuse-detection, revoke the entire
 * family (forces re-login on all devices in that chain).
 */
export async function consumeRefreshToken(plaintext: string): Promise<RefreshResult> {
  const tokenHash = hashRefreshToken(plaintext)
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!row) return { ok: false, reason: 'NOT_FOUND' }
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'EXPIRED' }
  if (row.revokedAt) {
    // Reuse of a revoked token → revoke the whole family
    await prisma.refreshToken.updateMany({
      where: { familyId: row.familyId, revokedAt: null },
      data: { revokedAt: new Date(), reusedAt: new Date() },
    })
    return { ok: false, reason: 'REUSED' }
  }
  return {
    ok: true,
    userId: row.userId,
    familyId: row.familyId,
    rotatedFromId: row.id,
  }
}

export async function revokeRefreshTokenById(id: string) {
  await prisma.refreshToken.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeRefreshFamily(familyId: string) {
  await prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
