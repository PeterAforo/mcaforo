/**
 * Client-safe helpers for resolving media variant URLs.
 *
 * The DB stores `variants` as JSON:
 *   { original: {url,width,height,size,key},
 *     thumb?: {...}, sm?: {...}, md?: {...}, lg?: {...},
 *     width, height }
 */

export type VariantName = 'thumb' | 'sm' | 'md' | 'lg' | 'original'

export interface MediaVariantUrl {
  url: string
  width: number
  height: number
}

export interface MediaLike {
  id: string
  filename: string
  originalName: string
  mimeType: string
  altText?: string | null
  variants?: unknown
}

function variantsObj(m: MediaLike): Record<string, MediaVariantUrl | undefined> {
  if (!m.variants || typeof m.variants !== 'object') return {}
  return m.variants as Record<string, MediaVariantUrl | undefined>
}

/**
 * Resolve the best URL for the requested size, falling back gracefully.
 * Order when a size is not available:  md -> sm -> lg -> original -> thumb
 */
export function mediaUrl(
  media: MediaLike | null | undefined,
  size: VariantName = 'md'
): string | null {
  if (!media) return null
  const v = variantsObj(media)
  const order: VariantName[] = [size, 'md', 'sm', 'lg', 'original', 'thumb']
  for (const s of order) {
    const hit = v[s]
    if (hit?.url) return hit.url
  }
  return null
}

export function mediaAlt(media: MediaLike | null | undefined): string {
  if (!media) return ''
  return media.altText?.trim() || media.originalName || media.filename || ''
}

/** Srcset string for `<img>` elements. */
export function mediaSrcSet(media: MediaLike | null | undefined): string | undefined {
  if (!media) return undefined
  const v = variantsObj(media)
  const parts: string[] = []
  if (v.thumb) parts.push(`${v.thumb.url} ${v.thumb.width}w`)
  if (v.sm) parts.push(`${v.sm.url} ${v.sm.width}w`)
  if (v.md) parts.push(`${v.md.url} ${v.md.width}w`)
  if (v.lg) parts.push(`${v.lg.url} ${v.lg.width}w`)
  return parts.length ? parts.join(', ') : undefined
}

export function isImage(mimeType: string | undefined | null): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

export function isVideo(mimeType: string | undefined | null): boolean {
  return !!mimeType && mimeType.startsWith('video/')
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
