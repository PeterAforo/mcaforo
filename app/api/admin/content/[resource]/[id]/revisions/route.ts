import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { getResource } from '@/lib/cms/resources'
import { listRevisions, restoreRevision } from '@/lib/cms/revisions'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ resource: string; id: string }> }

function entityTypeFor(slug: string): string {
  const map: Record<string, string> = {
    services: 'MarketingService',
    products: 'MarketingProduct',
    portfolio: 'Portfolio',
    'case-studies': 'CaseStudy',
    team: 'TeamMember',
    testimonials: 'Testimonial',
    faqs: 'FAQ',
    values: 'Value',
    'process-steps': 'ProcessStep',
    stats: 'Stat',
    partners: 'Partner',
  }
  return map[slug] ?? slug
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource, id } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.read', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const items = await listRevisions(entityTypeFor(resource), id, 50)
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource, id } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.update', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = (await req.json().catch(() => ({}))) as { revisionId?: string }
  if (!body.revisionId) {
    return NextResponse.json({ error: 'revisionId required' }, { status: 400 })
  }
  try {
    await restoreRevision(body.revisionId, async (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delegate = (prisma as any)[cfg.model]
      // Strip meta fields that shouldn't be overwritten
      const payload = { ...(data as Record<string, unknown>) }
      delete payload.id
      delete payload.createdAt
      delete payload.updatedAt
      await delegate.update({ where: { id }, data: payload })
    })
    await recordAudit(
      auditContextFromSession(auth.session, { headers: req.headers }),
      {
        action: 'restore',
        entityType: entityTypeFor(resource),
        entityId: id,
        newValues: { revisionId: body.revisionId },
      }
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Restore failed' },
      { status: 500 }
    )
  }
}
