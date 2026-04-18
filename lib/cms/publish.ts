import 'server-only'
import { prisma } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import { enqueueAt, JOB_NAMES } from '@/lib/jobs/queue'

/**
 * Sprint 7: Publishing state machine.
 *
 * Actions:
 *   publishNow(entityType, id)     — set status=PUBLISHED, publishedAt=now
 *   unpublishNow(entityType, id)   — set status=DRAFT
 *   schedule(entityType, id, runAt, action) — create ScheduledJob row, set status=SCHEDULED
 *
 * The pg-boss worker (see lib/jobs/workers/publish.ts below) picks up
 * ScheduledJob rows where status=PENDING and runAt<=now, then runs them.
 */

const TAGS_FOR: Record<string, string[]> = {
  Page: ['pages'],
  BlogPost: ['blog'],
  CaseStudy: ['case-studies'],
  MarketingService: ['marketing-services'],
  MarketingProduct: ['marketing-products'],
  Portfolio: ['portfolio'],
}

function delegate(entityType: string) {
  const model = entityType.charAt(0).toLowerCase() + entityType.slice(1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model]
}

export async function publishNow(entityType: string, id: string) {
  const now = new Date()
  const del = delegate(entityType)
  await del.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: now, scheduledAt: null },
  })
  for (const t of TAGS_FOR[entityType] ?? []) revalidateTag(t, 'default')
}

export async function unpublishNow(entityType: string, id: string) {
  const del = delegate(entityType)
  await del.update({
    where: { id },
    data: { status: 'DRAFT', scheduledAt: null },
  })
  for (const t of TAGS_FOR[entityType] ?? []) revalidateTag(t, 'default')
}

export async function schedule(
  entityType: string,
  id: string,
  runAt: Date,
  action: 'PUBLISH' | 'UNPUBLISH'
) {
  const del = delegate(entityType)
  await del.update({
    where: { id },
    data: { status: 'SCHEDULED', scheduledAt: runAt },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = await (prisma as any).scheduledJob.create({
    data: {
      entityType,
      entityId: id,
      action,
      runAt,
      status: 'PENDING',
    },
  })
  // Also register with pg-boss for out-of-band processing if worker is running.
  try {
    await enqueueAt(
      action === 'PUBLISH' ? JOB_NAMES.PUBLISH_CONTENT : JOB_NAMES.UNPUBLISH_CONTENT,
      { entityType, entityId: id, scheduledJobId: job.id },
      runAt
    )
  } catch {
    // pg-boss may not be installed in dev — the DB-backed fallback worker
    // in `runDueScheduledJobs()` still handles it.
  }
  return job
}

export async function cancelSchedule(entityType: string, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).scheduledJob.updateMany({
    where: { entityType, entityId: id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  })
  const del = delegate(entityType)
  await del.update({ where: { id }, data: { status: 'DRAFT', scheduledAt: null } })
}

/**
 * Fallback worker: run any due jobs that pg-boss hasn't picked up. Safe to
 * call from a cron (eg. every minute) or on-demand.
 */
export async function runDueScheduledJobs(): Promise<number> {
  const now = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const due = await (prisma as any).scheduledJob.findMany({
    where: { status: 'PENDING', runAt: { lte: now } },
    take: 50,
  })
  let done = 0
  for (const job of due) {
    try {
      if (job.action === 'PUBLISH') await publishNow(job.entityType, job.entityId)
      else await unpublishNow(job.entityType, job.entityId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).scheduledJob.update({
        where: { id: job.id },
        data: { status: 'DONE' },
      })
      done++
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).scheduledJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          lastError: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }
  return done
}
