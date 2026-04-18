import { prisma } from '@/lib/db'
import type { SessionUser } from '@/lib/auth'

/**
 * Structured audit-log wrapper. Every CMS mutation should funnel through
 * `recordAudit()` so we have a consistent activity feed and compliance trail.
 *
 * The existing `AuditLog` Prisma model already stores:
 *   userId, action, entityType, entityId, oldValues, newValues,
 *   ipAddress, userAgent, createdAt
 *
 * This helper normalizes inputs and makes the call fire-and-forget safe:
 * failures log to console but never throw, so a broken audit table cannot
 * block a legitimate write.
 */

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'schedule'
  | 'cancel_schedule'
  | 'restore_revision'
  | 'upload'
  | 'reorder'
  | 'login'
  | 'logout'

export interface AuditContext {
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
}

export interface AuditPayload {
  action: AuditAction
  entityType: string
  entityId: string
  oldValues?: unknown
  newValues?: unknown
}

export function auditContextFromSession(
  session: SessionUser,
  req?: { ip?: string | null; headers?: Headers } | null
): AuditContext {
  return {
    userId: session.id,
    ipAddress: req?.ip ?? null,
    userAgent: req?.headers?.get('user-agent') ?? null,
  }
}

export async function recordAudit(
  ctx: AuditContext,
  payload: AuditPayload
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        oldValues: (payload.oldValues as object | undefined) ?? undefined,
        newValues: (payload.newValues as object | undefined) ?? undefined,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    })
  } catch (err) {
    // Never throw from audit path. Log and move on.
    console.error('[audit] failed to record', { payload, err })
  }
}

/**
 * Compute a compact diff between two JSON-serializable objects. Produces
 * `{ added, removed, changed }` keyed by top-level field name. Suitable for
 * the activity feed UI and small enough to store inline in `newValues`.
 */
export function diffValues(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): { added: string[]; removed: string[]; changed: string[] } {
  const b = before ?? {}
  const a = after ?? {}
  const keys = new Set([...Object.keys(b), ...Object.keys(a)])
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  for (const k of keys) {
    const hasBefore = k in b
    const hasAfter = k in a
    if (!hasBefore && hasAfter) {
      added.push(k)
    } else if (hasBefore && !hasAfter) {
      removed.push(k)
    } else if (
      hasBefore &&
      hasAfter &&
      JSON.stringify((b as Record<string, unknown>)[k]) !==
        JSON.stringify((a as Record<string, unknown>)[k])
    ) {
      changed.push(k)
    }
  }
  return { added, removed, changed }
}
