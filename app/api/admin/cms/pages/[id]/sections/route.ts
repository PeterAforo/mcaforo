import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { validateSection } from '@/lib/cms/blocks'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SectionInput = z.object({
  id: z.string().optional(),
  blockType: z.string().min(1),
  data: z.unknown(),
  isActive: z.boolean().default(true),
})

const BulkSaveSchema = z.object({
  sections: z.array(SectionInput),
})

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/cms/pages/:id/sections
 * Returns all sections for the page, ordered.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'content.read', 'Page')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const sections = await prisma.pageSection.findMany({
    where: { pageId: id },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ sections })
}

/**
 * PUT /api/admin/cms/pages/:id/sections
 *
 * Bulk replace: accepts the full list of sections in order. Existing rows
 * matching by id are updated; new rows (no id) are created; removed rows are
 * deleted. This matches how the admin block builder saves.
 */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'content.update', 'Page')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = BulkSaveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Validate each section's data against its block schema.
  const validated: {
    id?: string
    blockType: string
    data: unknown
    isActive: boolean
    order: number
  }[] = []
  const errors: { index: number; errors: string[] }[] = []
  parsed.data.sections.forEach((s, i) => {
    const result = validateSection(s.blockType, s.data)
    if (!result.ok) {
      errors.push({ index: i, errors: result.errors })
    } else {
      validated.push({
        id: s.id,
        blockType: s.blockType,
        data: result.data,
        isActive: s.isActive,
        order: i,
      })
    }
  })

  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    )
  }

  // Apply the write in a transaction: delete missing, upsert the rest.
  const keepIds = validated.map((s) => s.id).filter(Boolean) as string[]
  const updated = await prisma.$transaction(async (tx) => {
    // Delete sections that were removed from the list.
    await tx.pageSection.deleteMany({
      where: {
        pageId: id,
        id: keepIds.length ? { notIn: keepIds } : undefined,
      },
    })

    // Upsert each section.
    const out: unknown[] = []
    for (const s of validated) {
      if (s.id) {
        const row = await tx.pageSection.update({
          where: { id: s.id },
          data: {
            blockType: s.blockType,
            data: s.data as object,
            isActive: s.isActive,
            order: s.order,
          },
        })
        out.push(row)
      } else {
        const row = await tx.pageSection.create({
          data: {
            pageId: id,
            blockType: s.blockType,
            data: s.data as object,
            isActive: s.isActive,
            order: s.order,
          },
        })
        out.push(row)
      }
    }
    return out
  })

  // Touch the page so list views sort correctly.
  await prisma.page.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  revalidateTag(`page:${page.slug}`)
  revalidateTag('pages')

  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    {
      action: 'update',
      entityType: 'Page',
      entityId: id,
      newValues: { sectionCount: validated.length },
    }
  )

  return NextResponse.json({ sections: updated })
}
