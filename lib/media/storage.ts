import 'server-only'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Pluggable media storage driver.
 *
 * Sprint 2 ships the local filesystem driver (writes under
 * `CMS_MEDIA_ROOT`, defaulting to `public/uploads`). The interface is
 * stable: swapping to S3/Cloudinary before production only requires a new
 * `StorageDriver` implementation here — no caller changes.
 *
 * URL convention:
 *   /uploads/{yyyy}/{mm}/{hash}-{variant}.{ext}
 * The public URL is returned relative (served by Next.js from /public).
 */

export interface StoredFile {
  key: string // relative path under root, e.g. "2026/04/abc-md.webp"
  url: string // public URL, e.g. "/uploads/2026/04/abc-md.webp"
  size: number
}

export interface StorageDriver {
  write(key: string, data: Buffer): Promise<StoredFile>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  resolveUrl(key: string): string
}

const MEDIA_ROOT = process.env.CMS_MEDIA_ROOT ?? 'public/uploads'
const PUBLIC_PREFIX = '/' + MEDIA_ROOT.replace(/^public\//, '').replace(/\\/g, '/')

function absolutePath(key: string): string {
  return path.resolve(process.cwd(), MEDIA_ROOT, key)
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export const localStorage: StorageDriver = {
  async write(key, data) {
    const abs = absolutePath(key)
    await ensureDir(path.dirname(abs))
    await fs.writeFile(abs, data)
    return {
      key,
      url: `${PUBLIC_PREFIX}/${key.replace(/\\/g, '/')}`,
      size: data.byteLength,
    }
  },
  async delete(key) {
    const abs = absolutePath(key)
    try {
      await fs.unlink(abs)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  },
  async exists(key) {
    try {
      await fs.access(absolutePath(key))
      return true
    } catch {
      return false
    }
  },
  resolveUrl(key) {
    return `${PUBLIC_PREFIX}/${key.replace(/\\/g, '/')}`
  },
}

/** Active driver. Future: swap based on `CMS_MEDIA_DRIVER` env. */
export const storage: StorageDriver = localStorage

/**
 * Build a storage key partitioned by date and keyed by content hash.
 * `hash` must be hex, `suffix` is the variant label ("original", "thumb", etc.).
 */
export function buildKey(
  hash: string,
  suffix: string,
  ext: string,
  date: Date = new Date()
): string {
  const yyyy = String(date.getUTCFullYear())
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const safeExt = ext.replace(/^\./, '').toLowerCase()
  return `${yyyy}/${mm}/${hash}-${suffix}.${safeExt}`
}
