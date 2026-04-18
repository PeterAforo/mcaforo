import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ListQuerySchema = z.object({
  folder: z.string().optional(),
  mime: z.string().optional(), // "image", "video", "application" or full mime
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(40),
})

/**
 * GET /api/admin/media
 *   ?folder=ID|null  ?mime=image|video|application|image%2Fjpeg
 *   ?search=foo      ?page=1&limit=40
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.read', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = ListQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const q = parsed.data

  const where: Record<string, unknown> = {}
  if (q.folder === 'null' || q.folder === '') {
    where.folderId = null
  } else if (q.folder) {
    where.folderId = q.folder
  }
  if (q.mime) {
    where.mimeType = q.mime.includes('/')
      ? q.mime
      : { startsWith: q.mime + '/' }
  }
  if (q.search) {
    where.OR = [
      { filename: { contains: q.search, mode: 'insensitive' } },
      { originalName: { contains: q.search, mode: 'insensitive' } },
      { altText: { contains: q.search, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: q.limit,
      skip: (q.page - 1) * q.limit,
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.media.count({ where }),
  ])

  return NextResponse.json({
    items,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      pages: Math.ceil(total / q.limit),
    },
  })
}
