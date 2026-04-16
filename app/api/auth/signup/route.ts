import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/utils'

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  selectedPlanId: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Generate verification token
    const verificationToken = generateToken()

    // Create user with company in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          email: data.email,
        },
      })

      // Create the user
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

      // Link user to company as primary contact
      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          isPrimary: true,
        },
      })

      // Assign CLIENT_ADMIN role (they own the company)
      const clientAdminRole = await tx.role.findUnique({
        where: { name: 'CLIENT_ADMIN' },
      })

      if (clientAdminRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: clientAdminRole.id,
          },
        })
      }

      // If a plan was selected, create a pending subscription
      let pendingSubscription = null
      if (data.selectedPlanId) {
        const plan = await tx.plan.findUnique({
          where: { id: data.selectedPlanId },
          include: { service: true },
        })

        if (plan) {
          pendingSubscription = await tx.subscription.create({
            data: {
              companyId: company.id,
              planId: plan.id,
              status: 'PENDING',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(), // Will be updated after payment
            },
          })
        }
      }

      return { user, company, pendingSubscription }
    })

    // Build verification URL with optional redirect to payment
    let verifyUrl = absoluteUrl(`/api/auth/verify?token=${verificationToken}`)
    if (result.pendingSubscription) {
      verifyUrl += `&subscriptionId=${result.pendingSubscription.id}`
    }

    // Send verification email
    await sendEmail({
      to: data.email,
      subject: 'Verify your email - McAforo',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0f172a;">Welcome to McAforo!</h1>
            <p>Hi ${data.firstName},</p>
            <p>Thank you for creating an account for <strong>${data.companyName}</strong>.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Verify Email${result.pendingSubscription ? ' & Continue to Payment' : ''}
              </a>
            </div>
            ${result.pendingSubscription ? `
              <p style="color: #666; font-size: 14px;">
                After verification, you'll be redirected to complete payment for your selected plan.
              </p>
            ` : ''}
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </body>
        </html>
      `,
    })

    return NextResponse.json(
      { 
        message: 'Account created. Please check your email to verify.',
        hasSubscription: !!result.pendingSubscription,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
