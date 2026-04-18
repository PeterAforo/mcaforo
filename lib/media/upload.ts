import 'server-only'
import crypto from 'crypto'
import path from 'path'

import { prisma } from '@/lib/db'
import { generateVariants, deleteVariants, type VariantSet } from '@/lib/media/variants'

/**
 * Upload orchestrator.
 *
 * Pipeline:
 *   1. Validate mime + magic bytes (via `file-type` when available)
 *   2. Size check vs. configured per-kind limits
 *   3. Compute SHA-256; dedupe against existing Media rows (return existing)
 *   4. Write original + variants via the storage driver
 *   5. Create Media row with full metadata
 *
 * Failure recovery: if the DB insert fails AFTER disk writes, we roll back the
 * files so we don't leak storage. Dedupe hits skip all writes.
 */

export interface UploadInput {
  buffer: Buffer
  originalName: string
  mimeType: string
  uploadedById: string
  folderId?: string | null
  altText?: string | null
  caption?: string | null
}

export interface UploadResult {
  media: Awaited<ReturnType<typeof prisma.media.create>>
  deduped: boolean
}

export class MediaUploadError extends Error {
  readonly code:
    | 'INVALID_MIME'
    | 'MIME_MISMATCH'
    | 'SIZE_EXCEEDED'
    | 'EMPTY_FILE'
    | 'UNSAFE_EXTENSION'
  constructor(code: MediaUploadError['code'], message: string) {
    super(message)
    this.name = 'MediaUploadError'
    this.code = code
  }
}

const ALLOWED_MIMES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
  // Documents
  'application/pdf',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const UNSAFE_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.php', '.js', '.html', '.htm',
])

function maxSizeForMime(mime: string): number {
  const mb = mime.startsWith('image/')
    ? Number(process.env.CMS_MEDIA_MAX_IMAGE_MB ?? 20)
    : mime.startsWith('video/')
    ? Number(process.env.CMS_MEDIA_MAX_VIDEO_MB ?? 100)
    : Number(process.env.CMS_MEDIA_MAX_DOC_MB ?? 50)
  return mb * 1024 * 1024
}

async function detectMagicMime(buffer: Buffer): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = (await import('file-type')) as unknown as {
      fileTypeFromBuffer?: (b: Buffer) => Promise<{ mime: string } | undefined>
    }
    if (!mod.fileTypeFromBuffer) return null
    const detected = await mod.fileTypeFromBuffer(buffer)
    return detected?.mime ?? null
  } catch {
    // Package not installed yet — log and allow through (best-effort).
    console.warn('[media] file-type not installed; skipping magic-byte check')
    return null
  }
}

/**
 * Compute a clean filename for display/download. Preserves original extension
 * but sanitizes the base name.
 */
function safeDisplayName(originalName: string, hash: string): string {
  const ext = path.extname(originalName).toLowerCase() || ''
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
  return `${base || hash.slice(0, 8)}${ext}`
}

export async function uploadMedia(input: UploadInput): Promise<UploadResult> {
  const { buffer, originalName, mimeType, uploadedById } = input

  if (buffer.byteLength === 0) {
    throw new MediaUploadError('EMPTY_FILE', 'File is empty')
  }

  if (!ALLOWED_MIMES.has(mimeType)) {
    throw new MediaUploadError(
      'INVALID_MIME',
      `Mime type "${mimeType}" is not allowed`
    )
  }

  const ext = path.extname(originalName).toLowerCase()
  if (UNSAFE_EXTENSIONS.has(ext)) {
    throw new MediaUploadError(
      'UNSAFE_EXTENSION',
      `Extension "${ext}" is blocked`
    )
  }

  const maxSize = maxSizeForMime(mimeType)
  if (buffer.byteLength > maxSize) {
    throw new MediaUploadError(
      'SIZE_EXCEEDED',
      `File exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
    )
  }

  // Magic-byte check. If we can detect, the detected mime MUST match the
  // claimed mime family (ignore charset etc). SVG is text so skipped here.
  if (mimeType !== 'image/svg+xml') {
    const detected = await detectMagicMime(buffer)
    if (detected && detected !== mimeType) {
      // Some browsers send image/jpg vs image/jpeg; normalize that case.
      const jpgMismatch =
        (detected === 'image/jpeg' && mimeType === 'image/jpg') ||
        (detected === 'image/jpg' && mimeType === 'image/jpeg')
      if (!jpgMismatch) {
        throw new MediaUploadError(
          'MIME_MISMATCH',
          `File bytes (${detected}) do not match declared mime (${mimeType})`
        )
      }
    }
  }

  // Hash for dedupe.
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')

  const existing = await prisma.media.findUnique({ where: { hash } })
  if (existing) {
    return { media: existing, deduped: true }
  }

  // Resolve storage extension: prefer original, fall back from mime.
  const storageExt = (ext || '.' + mimeType.split('/')[1]).replace('.', '')

  let variants: VariantSet
  try {
    variants = await generateVariants({
      buffer,
      mimeType,
      hash,
      originalExt: storageExt,
    })
  } catch (err) {
    console.error('[media] variant generation failed', err)
    throw err
  }

  try {
    const media = await prisma.media.create({
      data: {
        filename: safeDisplayName(originalName, hash),
        originalName,
        mimeType,
        size: buffer.byteLength,
        width: variants.width,
        height: variants.height,
        altText: input.altText ?? null,
        caption: input.caption ?? null,
        folderId: input.folderId ?? null,
        variants: variants as unknown as object,
        hash,
        uploadedById,
      },
    })
    return { media, deduped: false }
  } catch (err) {
    // Roll back disk writes on DB failure.
    await deleteVariants(variants).catch(() => void 0)
    throw err
  }
}

/**
 * Hard-delete a Media row and its underlying storage. Caller must verify
 * usages beforehand (see `lib/media/usage.ts` in Sprint 3+).
 */
export async function deleteMedia(id: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return
  await deleteVariants(media.variants as unknown as VariantSet | null)
  await prisma.media.delete({ where: { id } })
}
