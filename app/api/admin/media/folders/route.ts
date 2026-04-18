import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const CreateFolderSchema = z
  .object({
    name: z.string().min(1).max(80),
    parentId: z.string().nullable().optional(),
  })
  .strict()

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.read', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const folders = await prisma.mediaFolder.findMany({
    orderBy: [{ path: 'asc' }],
    include: {
      _count: { select: { media: true, children: true } },
    },
  })
  return NextResponse.json({ folders })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.update', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateFolderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { name, parentId } = parsed.data
  const slug = slugifyName(name)

  let path = `/${slug}`
  if (parentId) {
    const parent = await prisma.mediaFolder.findUnique({ where: { id: parentId } })
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }
    path = `${parent.path}/${slug}`
  }

  try {
    const folder = await prisma.mediaFolder.create({
      data: { name, slug, parentId: parentId ?? null, path },
    })
    return NextResponse.json({ folder }, { status: 201 })
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Folder already exists at this level' },
        { status: 409 }
      )
    }
    throw err
  }
}
