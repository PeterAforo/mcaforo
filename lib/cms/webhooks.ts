import 'server-only'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

/**
 * Sprint 10: Webhook dispatcher.
 *
 * Each outgoing webhook is signed with HMAC-SHA256 of the JSON body using
 * the subscription's secret. The receiving end verifies via the
 * `X-McAforo-Signature` header (value: `sha256=<hex>`).
 */

export type WebhookEvent =
  | 'content.published'
  | 'content.updated'
  | 'content.deleted'
  | 'contact.received'
  | 'payment.received'

export function signPayload(secret: string, body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
}

export async function dispatchWebhook(event: WebhookEvent, payload: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs = await (prisma as any).webhookSubscription.findMany({
    where: { isActive: true, events: { has: event } },
  })
  const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() })
  await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subs.map(async (sub: any) => {
      const sig = signPayload(sub.secret, body)
      const startedAt = Date.now()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delivery = await (prisma as any).webhookDelivery.create({
        data: {
          subscriptionId: sub.id,
          event,
          payload: JSON.parse(body),
          status: 'PENDING',
        },
      })
      try {
        const res = await fetch(sub.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-mcaforo-signature': sig,
            'x-mcaforo-event': event,
            'user-agent': 'McAforo-Webhooks/1.0',
          },
          body,
          signal: AbortSignal.timeout(10_000),
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: res.ok ? 'SUCCESS' : 'FAILED',
            responseStatus: res.status,
            responseBody: (await res.text().catch(() => '')).slice(0, 2000),
            durationMs: Date.now() - startedAt,
          },
        })
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            error: err instanceof Error ? err.message : String(err),
            durationMs: Date.now() - startedAt,
          },
        })
      }
    })
  )
}

/** Fire-and-forget — safe for route handlers. */
export function dispatchWebhookAsync(event: WebhookEvent, payload: unknown) {
  dispatchWebhook(event, payload).catch((e) => console.error('[webhook]', e))
}
