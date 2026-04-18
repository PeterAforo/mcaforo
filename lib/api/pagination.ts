import { z } from 'zod'

/**
 * Cursor-based pagination helper for mobile-friendly lists.
 *
 * Usage inside a route:
 *
 *   const { cursor, limit } = parseCursor(req)
 *   const rows = await prisma.invoice.findMany({
 *     where: { ... },
 *     orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
 *     take: limit + 1,
 *     ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
 *   })
 *   return NextResponse.json(buildPage(rows, limit))
 */
export const cursorQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export function parseCursor(req: Request): { cursor?: string; limit: number } {
  const url = new URL(req.url)
  const parsed = cursorQuerySchema.safeParse({
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) return { limit: 20 }
  return parsed.data
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

/**
 * Given `limit+1` rows fetched from the DB, split off the tail row as the
 * "next cursor" indicator.
 */
export function buildPage<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]!.id : null
  return { items, nextCursor }
}
