import { NextRequest, NextResponse } from 'next/server'
import { runDueScheduledJobs } from '@/lib/cms/publish'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron-triggered fallback worker.
 *
 * Intended to be hit every minute by Vercel Cron / external uptime monitor /
 * Windows Task Scheduler.
 *
 * Auth: either `?key=<CRON_SECRET>` or Authorization: Bearer <CRON_SECRET>.
 * Falls back to allowing localhost in development.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided =
    req.nextUrl.searchParams.get('key') ??
    (req.headers.get('authorization')?.replace(/^Bearer\s+/, '') ?? '')
  const isLocal = req.headers.get('host')?.startsWith('localhost') === true
  if (secret && provided !== secret && !(isLocal && process.env.NODE_ENV === 'development')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const count = await runDueScheduledJobs()
  return NextResponse.json({ processed: count, at: new Date().toISOString() })
}
