import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import Constants from 'expo-constants'

import { getTokens, saveTokens, clearTokens } from '@/store/secure-storage'

const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl ??
  'http://localhost:3000'

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

// ---------- request: attach bearer -------------------------------------------
api.interceptors.request.use(async (config) => {
  const tokens = await getTokens()
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  }
  return config
})

// ---------- response: single-flight refresh on 401 ---------------------------
let refreshInflight: Promise<string | null> | null = null

async function attemptRefresh(): Promise<string | null> {
  const tokens = await getTokens()
  if (!tokens?.refreshToken) return null
  try {
    const res = await axios.post(
      `${BASE_URL}/api/v1/auth/refresh`,
      { refreshToken: tokens.refreshToken, deviceId: tokens.deviceId },
      { timeout: 15000 }
    )
    const next = res.data as { accessToken: string; refreshToken: string; expiresIn: number }
    await saveTokens({
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      deviceId: tokens.deviceId,
    })
    return next.accessToken
  } catch {
    await clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { __retried?: boolean }) | undefined
    if (!original || original.__retried) throw error
    if (error.response?.status !== 401) throw error

    // Don't loop on refresh endpoint itself
    if (original.url?.includes('/api/v1/auth/refresh')) throw error

    original.__retried = true
    refreshInflight = refreshInflight ?? attemptRefresh().finally(() => {
      refreshInflight = null
    })
    const newAccess = await refreshInflight
    if (!newAccess) throw error
    original.headers = original.headers ?? {}
    ;(original.headers as any).Authorization = `Bearer ${newAccess}`
    return api.request(original)
  }
)

export function isApiError(err: unknown): err is AxiosError<ApiErrorBody> {
  return axios.isAxiosError(err)
}

export function apiMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isApiError(err)) {
    return err.response?.data?.error?.message ?? err.message ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}
