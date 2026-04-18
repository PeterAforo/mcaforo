/**
 * Client-side fetch helpers for the Media admin. All functions return
 * parsed JSON or throw a structured error for the caller to surface.
 */

export interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  altText: string | null
  caption: string | null
  folderId: string | null
  variants: unknown
  createdAt: string
  uploadedBy?: { id: string; firstName: string; lastName: string }
}

export interface MediaFolderItem {
  id: string
  name: string
  slug: string
  parentId: string | null
  path: string
  _count?: { media: number; children: number }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Accept': 'application/json',
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(init?.headers ?? {}),
    },
  })
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const j = (json ?? {}) as { error?: string; code?: string; details?: unknown }
    throw new ApiError(
      res.status,
      j.error ?? res.statusText,
      j.code,
      j.details
    )
  }
  return json as T
}

// --- Media ---

export function listMedia(params: {
  folder?: string | null
  mime?: string
  search?: string
  page?: number
  limit?: number
}) {
  const qs = new URLSearchParams()
  if (params.folder !== undefined) qs.set('folder', params.folder ?? 'null')
  if (params.mime) qs.set('mime', params.mime)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  return request<{ items: MediaItem[]; pagination: Pagination }>(
    `/api/admin/media?${qs.toString()}`
  )
}

export function getMedia(id: string) {
  return request<{ media: MediaItem & { usages: unknown[] } }>(
    `/api/admin/media/${id}`
  )
}

export function updateMedia(
  id: string,
  patch: Partial<Pick<MediaItem, 'altText' | 'caption' | 'folderId' | 'filename'>>
) {
  return request<{ media: MediaItem }>(`/api/admin/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteMediaItem(id: string, force = false) {
  return request<{ ok: true }>(
    `/api/admin/media/${id}${force ? '?force=true' : ''}`,
    { method: 'DELETE' }
  )
}

export function uploadFile(
  file: File,
  opts?: { folderId?: string | null; altText?: string; caption?: string },
  onProgress?: (pct: number) => void
): Promise<{ media: MediaItem; deduped: boolean }> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    if (opts?.folderId) form.append('folderId', opts.folderId)
    if (opts?.altText) form.append('altText', opts.altText)
    if (opts?.caption) form.append('caption', opts.caption)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/media/upload')
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      let body: unknown = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as { media: MediaItem; deduped: boolean })
      } else {
        const j = (body ?? {}) as { error?: string; code?: string }
        reject(new ApiError(xhr.status, j.error ?? xhr.statusText, j.code))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, 'Network error'))
    xhr.send(form)
  })
}

// --- Folders ---

export function listFolders() {
  return request<{ folders: MediaFolderItem[] }>(`/api/admin/media/folders`)
}

export function createFolder(name: string, parentId?: string | null) {
  return request<{ folder: MediaFolderItem }>(`/api/admin/media/folders`, {
    method: 'POST',
    body: JSON.stringify({ name, parentId: parentId ?? null }),
  })
}

export function renameFolder(id: string, name: string) {
  return request<{ folder: MediaFolderItem }>(`/api/admin/media/folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteFolder(id: string) {
  return request<{ ok: true }>(`/api/admin/media/folders/${id}`, {
    method: 'DELETE',
  })
}
