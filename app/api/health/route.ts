import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Lightweight liveness + DB readiness probe.
 * Used by mobile clients to detect connectivity and by uptime monitors.
 *
 *   200 → { ok: true, db: 'up', version, timestamp }
 *   503 → { ok: false, db: 'down', ... }
 */
export async function GET() {
  const startedAt = Date.now()
  let dbUp = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbUp = true
  } catch {
    dbUp = false
  }

  const body = {
    ok: dbUp,
    db: dbUp ? 'up' : 'down',
    version: process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, { status: dbUp ? 200 : 503 })
}
