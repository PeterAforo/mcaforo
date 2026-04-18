import { api } from './client'

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user?: SessionUser
}

// ---------- auth -------------------------------------------------------------
export const auth = {
  login: (body: { email: string; password: string; deviceId?: string }) =>
    api.post<TokenPair>('/api/v1/auth/login', body).then((r) => r.data),

  signup: (body: {
    firstName: string
    lastName: string
    email: string
    password: string
    companyName: string
    phone?: string | null
    verificationRedirect?: 'web' | 'mobile'
  }) => api.post('/api/v1/auth/signup', body).then((r) => r.data),

  refresh: (body: { refreshToken: string; deviceId?: string }) =>
    api.post<TokenPair>('/api/v1/auth/refresh', body).then((r) => r.data),

  logout: (body: { refreshToken: string; deviceId?: string }) =>
    api.post('/api/v1/auth/logout', body).then((r) => r.data),

  me: () => api.get<{ user: SessionUser }>('/api/v1/auth/me').then((r) => r.data.user),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }).then((r) => r.data),
}

// ---------- devices ----------------------------------------------------------
export const devices = {
  register: (body: {
    deviceId: string
    platform: 'IOS' | 'ANDROID' | 'WEB'
    pushToken?: string | null
    appVersion?: string
    osVersion?: string
    model?: string
    locale?: string
  }) => api.post('/api/v1/devices/register', body).then((r) => r.data),

  unregister: (deviceId: string) =>
    api.delete(`/api/v1/devices/${encodeURIComponent(deviceId)}`).then((r) => r.data),
}

// ---------- config -----------------------------------------------------------
export interface AppConfig {
  minSupportedVersion: string
  latestVersion: string
  forceUpdate: boolean
  maintenance: boolean
  features: Record<string, boolean>
  links: { privacy: string; terms: string; support: string; statusPage: string | null }
  serverTime: string
}
export const config = {
  app: () => api.get<AppConfig>('/api/v1/config/app').then((r) => r.data),
  health: () => api.get('/api/health').then((r) => r.data),
}

// ---------- notification preferences -----------------------------------------
export interface NotificationPreference {
  type: string
  email: boolean
  push: boolean
  inApp: boolean
}
export const notificationPrefs = {
  list: () =>
    api
      .get<{ preferences: NotificationPreference[] }>('/api/v1/users/notification-preferences')
      .then((r) => r.data.preferences),
  update: (preferences: NotificationPreference[]) =>
    api.put('/api/v1/users/notification-preferences', { preferences }).then((r) => r.data),
}

// ---------- portal (placeholder stubs — will use cursor pagination) ----------
export interface Invoice {
  id: string
  invoiceNumber: string
  total: string
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  createdAt: string
}
export const portal = {
  invoices: (params: { cursor?: string; limit?: number } = {}) =>
    api
      .get<{ items: Invoice[]; nextCursor: string | null }>('/api/invoices', { params })
      .then((r) => r.data),
  projects: (params: { cursor?: string; limit?: number } = {}) =>
    api.get('/api/projects', { params }).then((r) => r.data),
  tickets: (params: { cursor?: string; limit?: number } = {}) =>
    api.get('/api/tickets', { params }).then((r) => r.data),
}
