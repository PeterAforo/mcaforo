import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { getResource } from '@/lib/cms/resources'
import { publishNow, unpublishNow, schedule, cancelSchedule } from '@/lib/cms/publish'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  action: z.enum(['publish', 'unpublish', 'schedule', 'cancel-schedule']),
  runAt: z.string().datetime().optional(),
  scheduleAction: z.enum(['PUBLISH', 'UNPUBLISH']).optional(),
})

type Ctx = { params: Promise<{ resource: string; id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { resource, id } = await ctx.params
  const cfg = getResource(resource)
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  if (!can(auth.session, 'content.publish', cfg.resource)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Body.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const entityType = cfg.resource as string
  try {
    if (parsed.data.action === 'publish') {
      await publishNow(entityType, id)
    } else if (parsed.data.action === 'unpublish') {
      await unpublishNow(entityType, id)
    } else if (parsed.data.action === 'schedule') {
      if (!parsed.data.runAt) {
        return NextResponse.json({ error: 'runAt required' }, { status: 400 })
      }
      await schedule(
        entityType,
        id,
        new Date(parsed.data.runAt),
        parsed.data.scheduleAction ?? 'PUBLISH'
      )
    } else {
      await cancelSchedule(entityType, id)
    }
    await recordAudit(
      auditContextFromSession(auth.session, { headers: req.headers }),
      {
        action: parsed.data.action === 'schedule' ? 'schedule' : parsed.data.action === 'cancel-schedule' ? 'cancel_schedule' : parsed.data.action as 'publish' | 'unpublish',
        entityType,
        entityId: id,
        newValues: parsed.data as object,
      }
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[publish]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Publish failed' },
      { status: 500 }
    )
  }
}
