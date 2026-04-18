import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const ADMIN_ROLES = ['ADMIN', 'PM', 'SUPPORT', 'FINANCE', 'CONTENT_EDITOR'] as const

type AdminCheckResult =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getSession>>> }
  | { ok: false; response: NextResponse }

export async function requireAdmin(
  allowedRoles: readonly string[] = ADMIN_ROLES
): Promise<AdminCheckResult> {
  const session = await getSession()
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  const hasRole = session.roles?.some((r: string) => allowedRoles.includes(r))
  if (!hasRole) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { ok: true, session }
}
