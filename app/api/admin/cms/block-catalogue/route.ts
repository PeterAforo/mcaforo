import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { BLOCK_LIST } from '@/lib/cms/blocks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/cms/block-catalogue
 *
 * Returns a serialized catalogue of all registered blocks for the admin
 * block picker. The `defaults()` factory result is included so the client
 * can hydrate a new block instantly without an extra round-trip.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const catalogue = BLOCK_LIST.map((b) => ({
    type: b.type,
    label: b.label,
    description: b.description,
    icon: b.icon,
    defaultData: b.defaults(),
  }))
  return NextResponse.json({ catalogue })
}
