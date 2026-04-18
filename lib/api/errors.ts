import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard error envelope used by all /api/v1/* endpoints.
 *
 *   { error: { code, message, details? } }
 *
 * Always paired with the correct HTTP status code. Use the helpers in this
 * module so mobile/web clients can rely on a single shape.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'RATE_LIMITED'
  | 'UPGRADE_REQUIRED'
  | 'INTERNAL'

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: unknown
}

const CODE_TO_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  UPGRADE_REQUIRED: 426,
  INTERNAL: 500,
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status: CODE_TO_STATUS[code] }
  )
}

export function apiErrorFromZod(err: ZodError): NextResponse {
  return apiError('UNPROCESSABLE', 'Validation failed', err.flatten())
}

/**
 * Wrap an async route handler; convert uncaught errors into a standard
 * INTERNAL response so mobile clients always receive the canonical envelope.
 */
export function withApiErrors<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (err) {
      if (err instanceof ZodError) return apiErrorFromZod(err)
      // eslint-disable-next-line no-console
      console.error('[api] unhandled error:', err)
      return apiError('INTERNAL', 'Internal server error')
    }
  }) as T
}
