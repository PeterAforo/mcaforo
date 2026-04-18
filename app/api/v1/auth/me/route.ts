import { NextRequest, NextResponse } from 'next/server'

import { resolveUser } from '@/lib/auth/resolve'
import { apiError, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export const GET = withApiErrors(async (req: NextRequest) => {
  const user = await resolveUser(req)
  if (!user) return apiError('UNAUTHORIZED', 'Not authenticated')
  return NextResponse.json({ user })
})
