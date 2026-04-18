import 'server-only'

/**
 * pg-boss-backed job queue skeleton.
 *
 * Sprint 1 deliverable: set up the queue singleton and typed job names so
 * downstream sprints (publishing, webhooks, media variants) can register
 * handlers without re-wiring. The queue is lazy-initialized on first use
 * because Next.js dev-server hot reloads would otherwise spawn duplicate
 * boss instances.
 *
 * IMPORTANT: This module is marked `server-only` so it never leaks into
 * client bundles. The `pg-boss` package is a peer dependency; see
 * @/docs/cms-architecture.md §4.3 for the install list.
 */

export const JOB_NAMES = {
  // Sprint 7 consumers
  PUBLISH_CONTENT: 'cms.publish-content',
  UNPUBLISH_CONTENT: 'cms.unpublish-content',
  // Sprint 10 consumers
  DELIVER_WEBHOOK: 'cms.deliver-webhook',
  // Sprint 2 consumers
  GENERATE_MEDIA_VARIANTS: 'cms.generate-media-variants',
  // Existing recurring-invoice system (already planned pre-CMS)
  RECURRING_INVOICE_ISSUE: 'billing.issue-recurring-invoice',
} as const

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES]

export interface PublishContentPayload {
  entityType: string
  entityId: string
  scheduledJobId: string
}

export interface DeliverWebhookPayload {
  webhookId: string
  event: string
  payload: unknown
  attempt: number
}

export interface GenerateMediaVariantsPayload {
  mediaId: string
}

// Minimal structural type so we don't force an import of `pg-boss` at this
// layer; the real package exposes the full PgBoss class. We only use the
// methods listed below across the codebase.
interface PgBossLike {
  start(): Promise<unknown>
  stop(opts?: { graceful?: boolean; timeout?: number }): Promise<void>
  send(name: string, data: unknown, options?: unknown): Promise<string | null>
  sendAfter(
    name: string,
    data: unknown,
    options: unknown,
    after: Date | string | number
  ): Promise<string | null>
  work(
    name: string,
    handler: (job: { id: string; name: string; data: unknown }) => Promise<void>
  ): Promise<string>
  cancel(jobId: string): Promise<void>
}

declare global {
  var __pgBoss: PgBossLike | undefined
  var __pgBossStarting: Promise<PgBossLike> | undefined
}

/**
 * Get the shared pg-boss instance, starting it on first call.
 * Safe to call from API handlers and server actions. Worker processes should
 * call `work()` once at boot.
 */
export async function getQueue(): Promise<PgBossLike> {
  if (globalThis.__pgBoss) return globalThis.__pgBoss
  if (globalThis.__pgBossStarting) return globalThis.__pgBossStarting

  globalThis.__pgBossStarting = (async () => {
    // Dynamic import: pg-boss is not a required runtime dep of every route;
    // this also prevents bundlers from tree-shaking it incorrectly.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import('pg-boss').catch((err) => {
      console.error(
        '[queue] pg-boss is not installed yet. Run `npm install pg-boss` to enable background jobs.'
      )
      throw err
    })
    const PgBoss = (mod as unknown as { default: new (cs: string | object) => PgBossLike }).default

    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('[queue] DATABASE_URL not set; cannot start pg-boss')
    }

    const schema = process.env.PGBOSS_SCHEMA ?? 'pgboss'
    const boss = new PgBoss({ connectionString, schema }) as PgBossLike
    await boss.start()
    globalThis.__pgBoss = boss
    return boss
  })()

  try {
    const boss = await globalThis.__pgBossStarting
    return boss
  } finally {
    globalThis.__pgBossStarting = undefined
  }
}

/**
 * Enqueue a job to run immediately (subject to worker availability).
 */
export async function enqueue<T>(name: JobName, data: T): Promise<string | null> {
  const boss = await getQueue()
  return boss.send(name, data as unknown)
}

/**
 * Enqueue a job to run at or after the given time. Used by the scheduled
 * publishing flow (Sprint 7).
 */
export async function enqueueAt<T>(
  name: JobName,
  data: T,
  runAt: Date
): Promise<string | null> {
  const boss = await getQueue()
  return boss.sendAfter(name, data as unknown, {}, runAt)
}

/**
 * Register a handler for a named job. Workers call this at boot; see
 * `@/lib/jobs/workers/*` (to be added in subsequent sprints).
 */
export async function registerWorker<T>(
  name: JobName,
  handler: (data: T) => Promise<void>
): Promise<void> {
  const boss = await getQueue()
  await boss.work(name, async (job) => {
    await handler(job.data as T)
  })
}

/**
 * Gracefully stop the queue. Call from a server process's shutdown hook.
 */
export async function stopQueue(): Promise<void> {
  if (!globalThis.__pgBoss) return
  await globalThis.__pgBoss.stop({ graceful: true, timeout: 30_000 })
  globalThis.__pgBoss = undefined
}
