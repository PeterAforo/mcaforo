import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/utils'
import { apiError, apiErrorFromZod, withApiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const signupSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  phone: z.string().optional().nullable(),
  /**
   * Mobile deep-link base — when supplied, verification email points to
   * `mcaforo://verify?token=...` instead of the web URL.
   */
  verificationRedirect: z.enum(['web', 'mobile']).default('web'),
})

/**
 * Mobile-ready signup. Does NOT auto-login (email verification required).
 * Returns 201 on success; client should prompt "Check your email".
 */
export const POST = withApiErrors(async (request: NextRequest) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body')
  }

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) return apiErrorFromZod(parsed.error)
  const data = parsed.data

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) return apiError('CONFLICT', 'An account with this email already exists')

  const passwordHash = await hashPassword(data.password)
  const verificationToken = generateToken()

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: data.companyName, email: data.email },
    })

    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        emailVerifyToken: verificationToken,
        status: 'PENDING',
      },
    })

    await tx.companyUser.create({
      data: { userId: user.id, companyId: company.id, isPrimary: true },
    })

    const clientAdminRole = await tx.role.findUnique({ where: { name: 'CLIENT_ADMIN' } })
    if (clientAdminRole) {
      await tx.userRole.create({ data: { userId: user.id, roleId: clientAdminRole.id } })
    }

    return { user, company }
  })

  const verifyUrl =
    data.verificationRedirect === 'mobile'
      ? `mcaforo://verify?token=${verificationToken}`
      : absoluteUrl(`/api/auth/verify?token=${verificationToken}`)

  await sendEmail({
    to: data.email,
    subject: 'Verify your email - McAforo',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#0f172a">Welcome to McAforo!</h1>
        <p>Hi ${data.firstName},</p>
        <p>Verify your email to activate your account:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${verifyUrl}" style="background:#F26522;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Verify Email</a>
        </p>
      </div>
    `,
  })

  return NextResponse.json(
    { ok: true, userId: result.user.id, message: 'Verification email sent' },
    { status: 201 }
  )
})
