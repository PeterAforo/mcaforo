import 'server-only'

/**
 * Sprint 11: In-memory rate limiter (per-process, per-IP-or-key).
 *
 * For multi-instance deploys, swap `store` with an upstash/redis backend.
 * The interface is intentionally minimal.
 */

interface Bucket {
  tokens: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetInSeconds: number
  limit: number
}

/**
 * `key` should be stable per-identity (eg. `ip:1.2.3.4` or `apikey:<id>`).
 * `max` requests per `windowMs` milliseconds.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const b = store.get(key)
  if (!b || b.resetAt <= now) {
    store.set(key, { tokens: max - 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, resetInSeconds: Math.ceil(windowMs / 1000), limit: max }
  }
  if (b.tokens <= 0) {
    return { ok: false, remaining: 0, resetInSeconds: Math.ceil((b.resetAt - now) / 1000), limit: max }
  }
  b.tokens -= 1
  return { ok: true, remaining: b.tokens, resetInSeconds: Math.ceil((b.resetAt - now) / 1000), limit: max }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'x-ratelimit-limit': String(result.limit),
    'x-ratelimit-remaining': String(result.remaining),
    'x-ratelimit-reset': String(result.resetInSeconds),
  }
}

/** Extract a best-effort IP from a Next.js request. */
export function clientIp(req: { headers: Headers }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
