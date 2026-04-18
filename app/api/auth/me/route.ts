import { NextRequest, NextResponse } from 'next/server'

import { resolveUser } from '@/lib/auth/resolve'

export async function GET(req: NextRequest) {
  try {
    // Accept bearer (mobile) OR session cookie (web) transparently.
    const session = await resolveUser(req)

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: session })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
