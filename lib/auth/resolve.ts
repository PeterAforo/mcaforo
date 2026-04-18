import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { verifySession, type SessionUser } from '@/lib/auth'
import { verifyAccessToken } from '@/lib/auth/tokens'

/**
 * Resolve the authenticated user from either:
 *   1. `Authorization: Bearer <jwt>` (mobile / 3rd-party clients)
 *   2. `session` httpOnly cookie (existing web app)
 *
 * Returns null if neither is present or valid.
 *
 * This is the canonical replacement for `getSession()` going forward.
 */
export async function resolveUser(req?: NextRequest): Promise<SessionUser | null> {
  // 1. Bearer token
  const authHeader =
    req?.headers.get('authorization') ?? req?.headers.get('Authorization') ?? null
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) {
      const user = await verifyAccessToken(token)
      if (user) return user
      // Fall through to cookie — bearer was present but invalid; still try cookie
      // so the call site can distinguish with a follow-up check if needed.
    }
  }

  // 2. Cookie session (unchanged behaviour)
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null
    return await verifySession(token)
  } catch {
    return null
  }
}

/** Throw-style variant that returns a user or null; thin wrapper for clarity. */
export async function requireUser(req?: NextRequest): Promise<SessionUser | null> {
  return resolveUser(req)
}
