import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import {
  verifyPassword,
  createSession,
  setSessionCookie,
} from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      console.log('Login failed: User not found for email:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('Login attempt for:', email, 'emailVerified:', user.emailVerified, 'status:', user.status)

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('Login failed: Email not verified for:', email)
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      console.log('Login failed: Account not active for:', email, 'status:', user.status)
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      console.log('Login failed: Invalid password for:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const token = await createSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.userRoles.map((ur) => ur.role.name),
    })

    // Set session cookie
    await setSessionCookie(token)

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.userRoles.map((ur) => ur.role.name),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
