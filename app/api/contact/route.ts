import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { rateLimit, clientIp, rateLimitHeaders } from '@/lib/cms/rate-limit'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Sprint 11: throttle to 5 requests / 10 min per IP
    const ip = clientIp(request)
    const rl = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rl) }
      )
    }
    const body = await request.json()
    const data = contactSchema.parse(body)

    // Sprint 9: persist to DB for admin inbox
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).contactSubmission.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          company: data.company ?? null,
          service: data.service ?? null,
          message: data.message,
          ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0] ??
            request.headers.get('x-real-ip') ??
            null,
          userAgent: request.headers.get('user-agent') ?? null,
        },
      })
    } catch (persistErr) {
      console.error('[contact] persist failed', persistErr)
    }

    return NextResponse.json(
      { message: 'Message received successfully' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
