/**
 * Expo Push API wrapper.
 *
 * Sends notifications to registered devices (iOS via APNs, Android via FCM).
 * Fire-and-forget style: exceptions are logged, not thrown, so a push failure
 * never aborts a business operation (e.g. creating an invoice).
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
import { prisma } from '@/lib/db'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const MAX_BATCH = 100

export interface ExpoPushMessage {
  to: string | string[]
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  channelId?: string
  priority?: 'default' | 'normal' | 'high'
  ttl?: number
}

interface ExpoTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoTicket[]> {
  if (messages.length === 0) return []
  const tickets: ExpoTicket[] = []
  for (let i = 0; i < messages.length; i += MAX_BATCH) {
    const batch = messages.slice(i, i + MAX_BATCH)
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'accept-encoding': 'gzip, deflate',
          'content-type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(batch),
      })
      const json = (await res.json()) as { data?: ExpoTicket[]; errors?: unknown }
      if (json.data) tickets.push(...json.data)
      if (json.errors) {
        // eslint-disable-next-line no-console
        console.error('[push] expo errors', json.errors)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[push] batch failed', err)
    }
  }
  return tickets
}

export type NotificationType =
  | 'invoice.new'
  | 'invoice.paid'
  | 'ticket.reply'
  | 'ticket.status'
  | 'project.updated'
  | 'content.new'
  | 'chat.reply'
  | 'admin.publish'

export interface NotifyPayload {
  title: string
  body: string
  data?: Record<string, unknown>
  /** Deep link path, e.g. `mcaforo://invoices/abc123` */
  deepLink?: string
  /** Override badge count (else uses user's unread count). */
  badge?: number
}

/**
 * High-level facade: dispatch a notification to every registered device of a
 * user, respecting their notification preferences. Safe to call from any
 * business workflow.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  payload: NotifyPayload
): Promise<void> {
  try {
    const [pref, devices] = await Promise.all([
      prisma.notificationPreference.findUnique({ where: { userId_type: { userId, type } } }),
      prisma.device.findMany({
        where: { userId, pushToken: { not: null } },
        select: { pushToken: true, platform: true },
      }),
    ])

    // Default to enabled; respect explicit opt-out.
    const pushAllowed = pref?.push ?? true
    if (!pushAllowed || devices.length === 0) return

    const messages: ExpoPushMessage[] = devices
      .filter((d): d is { pushToken: string; platform: 'IOS' | 'ANDROID' | 'WEB' } => !!d.pushToken)
      .map((d) => ({
        to: d.pushToken,
        title: payload.title,
        body: payload.body,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        badge: payload.badge,
        data: {
          type,
          ...(payload.data ?? {}),
          ...(payload.deepLink ? { deepLink: payload.deepLink } : {}),
        },
      }))

    await sendExpoPush(messages)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] notifyUser failed', { userId, type, err })
  }
}
