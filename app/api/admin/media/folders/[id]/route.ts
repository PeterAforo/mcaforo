import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UpdateSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
  })
  .strict()

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.update', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const folder = await prisma.mediaFolder.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json({ folder })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.delete', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params

  // Refuse delete if folder (or descendants) contain media.
  const folder = await prisma.mediaFolder.findUnique({
    where: { id },
    include: { _count: { select: { media: true, children: true } } },
  })
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (folder._count.media > 0 || folder._count.children > 0) {
    return NextResponse.json(
      {
        error: 'Folder is not empty',
        code: 'NOT_EMPTY',
        counts: folder._count,
      },
      { status: 409 }
    )
  }

  await prisma.mediaFolder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
