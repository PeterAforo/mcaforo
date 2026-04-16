import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'your-secret-key-change-in-production'
)

const publicRoutes = [
  '/',
  '/about',
  '/services',
  '/case-studies',
  '/blog',
  '/contact',
  '/privacy',
  '/terms',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/newsletter',
]

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

const adminRoutes = ['/admin']

const portalRoutes = ['/portal']

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  
  // Check for dynamic routes
  if (pathname.startsWith('/services/')) return true
  if (pathname.startsWith('/case-studies/')) return true
  if (pathname.startsWith('/blog/')) return true
  if (pathname.startsWith('/newsletter/')) return true
  if (pathname.startsWith('/api/newsletter/')) return true
  if (pathname.startsWith('/api/contact')) return true
  if (pathname.startsWith('/api/auth/')) return true
  
  return false
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((route) => pathname.startsWith(route))
}

function isPortalRoute(pathname: string): boolean {
  return portalRoutes.some((route) => pathname.startsWith(route))
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; email: string; roles: string[] }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Verify token for protected routes
  const user = token ? await verifyToken(token) : null

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname) && user) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // Protect portal routes
  if (isPortalRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect admin routes
  if (isAdminRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const ADMIN_ROLES = ['ADMIN', 'SUPPORT', 'PM', 'FINANCE']
    const hasAdminRole = user.roles?.some((role) => ADMIN_ROLES.includes(role))
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
