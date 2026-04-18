import { NextResponse } from 'next/server'
import { unstable_cache as cache } from 'next/cache'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const getMap = cache(
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma as any).redirect.findMany({
      where: { isActive: true },
      select: { source: true, destination: true, statusCode: true },
    })
    const out: Record<string, { destination: string; statusCode: number }> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of rows as any[]) {
      out[r.source] = { destination: r.destination, statusCode: r.statusCode }
    }
    return out
  },
  ['redirects-map'],
  { tags: ['redirects'], revalidate: 3600 }
)

export async function GET() {
  const map = await getMap()
  return NextResponse.json(map, {
    headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  })
}
