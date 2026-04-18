import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Empty string → null. Keeps optional email/URL fields clearable via the form.
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema)

const Schema = z
  .object({
    siteName: z.string().min(1).max(120).optional(),
    tagline: emptyToNull(z.string().max(200).nullable()).optional(),
    contactEmail: emptyToNull(z.string().email().nullable()).optional(),
    contactPhone: emptyToNull(z.string().max(40).nullable()).optional(),
    address: emptyToNull(z.string().max(500).nullable()).optional(),
    socials: z.record(z.string(), z.string()).nullable().optional(),
    logo: emptyToNull(z.string().nullable()).optional(),
    logoDark: emptyToNull(z.string().nullable()).optional(),
    favicon: emptyToNull(z.string().nullable()).optional(),
    ogDefaultImage: emptyToNull(z.string().nullable()).optional(),
    footerHtml: emptyToNull(z.string().nullable()).optional(),
    gtmId: emptyToNull(z.string().max(40).nullable()).optional(),
    gaMeasurementId: emptyToNull(z.string().max(40).nullable()).optional(),
    noindexAll: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
    robotsExtra: emptyToNull(z.string().nullable()).optional(),
  })
  // Silently drop unknown keys (e.g. createdAt/updatedAt forwarded by the client).
  .strip()

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'settings.read', 'SiteSettings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = await (prisma as any).siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'settings.update', 'SiteSettings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = await (prisma as any).siteSettings.upsert({
    where: { id: 'singleton' },
    update: parsed.data,
    create: { id: 'singleton', ...parsed.data },
  })
  // Next 16 requires a profile as the second arg; pass 'default'.
  revalidateTag('site-settings', 'default')
  revalidateTag('pages', 'default')
  await recordAudit(
    auditContextFromSession(auth.session, { headers: req.headers }),
    {
      action: 'update',
      entityType: 'SiteSettings',
      entityId: 'singleton',
      newValues: parsed.data,
    }
  )
  return NextResponse.json({ settings })
}
