import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Returns runtime configuration the mobile app needs on launch:
 *   - minimum supported app version (used to force-upgrade old installs)
 *   - latest published app version
 *   - maintenance mode flag
 *   - feature flags
 *   - API base URL echo (helps debug environment routing)
 */
export async function GET() {
  return NextResponse.json({
    minSupportedVersion: process.env.MOBILE_MIN_APP_VERSION ?? '1.0.0',
    latestVersion: process.env.MOBILE_LATEST_APP_VERSION ?? '1.0.0',
    forceUpdate: process.env.MOBILE_FORCE_UPDATE === 'true',
    maintenance: process.env.APP_MAINTENANCE_MODE === 'true',
    features: {
      push: true,
      biometrics: true,
      offlineQueue: true,
      payments: true,
      chat: true,
    },
    links: {
      privacy: '/privacy',
      terms: '/terms',
      support: '/contact',
      statusPage: null as string | null,
    },
    serverTime: new Date().toISOString(),
  })
}
