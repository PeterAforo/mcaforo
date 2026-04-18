import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { deleteMedia } from '@/lib/media/upload'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UpdateSchema = z
  .object({
    altText: z.string().max(500).nullable().optional(),
    caption: z.string().max(1000).nullable().optional(),
    folderId: z.string().nullable().optional(),
    filename: z.string().max(100).optional(),
  })
  .strict()

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.read', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      folder: true,
      usages: true,
    },
  })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ media })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.update', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const existing = await prisma.media.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const media = await prisma.media.update({
    where: { id },
    data: parsed.data,
  })

  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    {
      action: 'update',
      entityType: 'Media',
      entityId: id,
      oldValues: existing,
      newValues: parsed.data,
    }
  )

  return NextResponse.json({ media })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.delete', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const url = req.nextUrl
  const force = url.searchParams.get('force') === 'true'

  const media = await prisma.media.findUnique({
    where: { id },
    include: { usages: true },
  })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (media.usages.length > 0 && !force) {
    return NextResponse.json(
      {
        error: 'Media is in use',
        code: 'IN_USE',
        usages: media.usages,
      },
      { status: 409 }
    )
  }

  await deleteMedia(id)

  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    {
      action: 'delete',
      entityType: 'Media',
      entityId: id,
      oldValues: {
        filename: media.filename,
        mimeType: media.mimeType,
        size: media.size,
      },
    }
  )

  return NextResponse.json({ ok: true })
}
