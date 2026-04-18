import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { can } from '@/lib/auth/permissions'
import { uploadMedia, MediaUploadError } from '@/lib/media/upload'
import { recordAudit, auditContextFromSession } from '@/lib/cms/audit'

export const runtime = 'nodejs' // sharp + fs need Node runtime
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/media/upload
 *
 * Body: multipart/form-data
 *   file: File (required)
 *   folderId: string (optional)
 *   altText: string (optional)
 *   caption: string (optional)
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!can(auth.session, 'media.upload', 'Media')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Invalid multipart body' },
      { status: 400 }
    )
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const folderId = (form.get('folderId') as string | null) || null
  const altText = (form.get('altText') as string | null) || null
  const caption = (form.get('caption') as string | null) || null

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const { media, deduped } = await uploadMedia({
      buffer,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      uploadedById: auth.session.id,
      folderId,
      altText,
      caption,
    })

    if (!deduped) {
      await recordAudit(auditContextFromSession(auth.session, { headers: req.headers }), {
        action: 'upload',
        entityType: 'Media',
        entityId: media.id,
        newValues: {
          filename: media.filename,
          mimeType: media.mimeType,
          size: media.size,
        },
      })
    }

    return NextResponse.json({ media, deduped }, { status: deduped ? 200 : 201 })
  } catch (err) {
    if (err instanceof MediaUploadError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      )
    }
    console.error('[media/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
