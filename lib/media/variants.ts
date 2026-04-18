import 'server-only'
import { storage, buildKey, type StoredFile } from '@/lib/media/storage'

/**
 * Responsive image variant generator backed by `sharp`.
 *
 * Outputs WebP at 4 breakpoints plus the original. Each variant is only
 * generated if the source image is at least that wide (prevents upscaling).
 * Non-image mime types (PDF, video, etc.) bypass the pipeline and only the
 * original is stored.
 *
 * Sharp is imported dynamically so the media API module still compiles
 * in environments where the native binary isn't installed yet (TS errors
 * disappear once `npm install sharp` completes).
 */

export interface Variant {
  url: string
  width: number
  height: number
  size: number
  key: string
}

export interface VariantSet {
  original: Variant
  thumb?: Variant
  sm?: Variant
  md?: Variant
  lg?: Variant
  width: number | null
  height: number | null
}

interface BreakpointSpec {
  name: 'thumb' | 'sm' | 'md' | 'lg'
  width: number
}

const BREAKPOINTS: BreakpointSpec[] = [
  { name: 'thumb', width: 320 },
  { name: 'sm', width: 640 },
  { name: 'md', width: 1200 },
  { name: 'lg', width: 1920 },
]

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
])

/**
 * Lazy-load sharp. Returns null when the module isn't installed so callers
 * can fall back to storing the original only.
 */
async function loadSharp(): Promise<typeof import('sharp') | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = (await import('sharp')) as unknown as {
      default: typeof import('sharp')
    }
    return mod.default ?? (mod as unknown as typeof import('sharp'))
  } catch {
    console.warn(
      '[media] sharp is not installed. Install with `npm install sharp` to enable image variants.'
    )
    return null
  }
}

/**
 * Generate variants and write all outputs through the storage driver.
 * Returns the full `VariantSet` to persist on the `Media` row.
 */
export async function generateVariants(params: {
  buffer: Buffer
  mimeType: string
  hash: string
  originalExt: string
}): Promise<VariantSet> {
  const { buffer, mimeType, hash, originalExt } = params

  // Always write the original untouched.
  const origKey = buildKey(hash, 'original', originalExt)
  const orig = await storage.write(origKey, buffer)

  // Non-images: no variants.
  if (!IMAGE_MIMES.has(mimeType) || mimeType === 'image/svg+xml') {
    return {
      original: { ...orig, width: 0, height: 0 },
      width: null,
      height: null,
    }
  }

  const sharp = await loadSharp()
  if (!sharp) {
    return {
      original: { ...orig, width: 0, height: 0 },
      width: null,
      height: null,
    }
  }

  const meta = await sharp(buffer).metadata()
  const srcWidth = meta.width ?? 0
  const srcHeight = meta.height ?? 0

  const variants: Partial<VariantSet> = {
    original: { ...orig, width: srcWidth, height: srcHeight },
    width: srcWidth,
    height: srcHeight,
  }

  for (const bp of BREAKPOINTS) {
    if (srcWidth > 0 && srcWidth < bp.width) continue // don't upscale
    const webp = await sharp(buffer)
      .resize({ width: bp.width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })

    const key = buildKey(hash, bp.name, 'webp')
    const stored: StoredFile = await storage.write(key, webp.data)
    variants[bp.name] = {
      ...stored,
      width: webp.info.width,
      height: webp.info.height,
    }
  }

  return variants as VariantSet
}

/**
 * Delete all variant files belonging to a Media row. Used on hard-delete.
 */
export async function deleteVariants(variants: VariantSet | null): Promise<void> {
  if (!variants) return
  const keys = [
    variants.original?.key,
    variants.thumb?.key,
    variants.sm?.key,
    variants.md?.key,
    variants.lg?.key,
  ].filter(Boolean) as string[]
  await Promise.all(keys.map((k) => storage.delete(k)))
}

export const MEDIA_BREAKPOINTS = BREAKPOINTS
