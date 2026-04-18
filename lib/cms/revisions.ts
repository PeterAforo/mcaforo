import 'server-only'
import { prisma } from '@/lib/db'

/**
 * Sprint 8: Polymorphic revision store.
 */

export async function recordRevision(
  entityType: string,
  entityId: string,
  authorId: string,
  data: unknown,
  message?: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).revision.create({
    data: {
      entityType,
      entityId,
      data: data as object,
      authorId,
      message: message ?? null,
    },
  })
}

export async function listRevisions(entityType: string, entityId: string, take = 50) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).revision.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })
}

export async function getRevision(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).revision.findUnique({
    where: { id },
    include: { author: { select: { firstName: true, lastName: true, email: true } } },
  })
}

export async function restoreRevision(
  id: string,
  applyFn: (data: unknown) => Promise<void>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rev = await (prisma as any).revision.findUnique({ where: { id } })
  if (!rev) throw new Error('Revision not found')
  await applyFn(rev.data)
  return rev
}

/**
 * Compact text-level diff between two JSON snapshots. Returns a list of
 * `{path, before, after}` entries for all differing primitive leaves.
 */
export function jsonDiff(
  a: unknown,
  b: unknown,
  basePath = ''
): { path: string; before: unknown; after: unknown }[] {
  const out: { path: string; before: unknown; after: unknown }[] = []
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push({ path: basePath || '$', before: a, after: b })
    }
    return out
  }
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
  for (const k of keys) {
    out.push(...jsonDiff(aObj[k], bObj[k], basePath ? `${basePath}.${k}` : k))
  }
  return out
}
