import { create } from 'zustand'

import { auth as authApi, devices as devicesApi, SessionUser } from '@/api/endpoints'
import { clearTokens, getOrCreateDeviceId, getTokens, saveTokens } from './secure-storage'
import { registerForPush, unregisterPush } from '@/lib/push'

interface AuthState {
  user: SessionUser | null
  loading: boolean
  hydrated: boolean

  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: SessionUser | null) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const tokens = await getTokens()
      if (!tokens) {
        set({ hydrated: true })
        return
      }
      const user = await authApi.me().catch(() => null)
      set({ user, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const deviceId = await getOrCreateDeviceId()
      const res = await authApi.login({ email, password, deviceId })
      await saveTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        deviceId,
      })
      set({ user: res.user ?? null })
      // Fire-and-forget push registration
      registerForPush().catch(() => undefined)
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    const tokens = await getTokens()
    try {
      if (tokens?.refreshToken) {
        await authApi
          .logout({ refreshToken: tokens.refreshToken, deviceId: tokens.deviceId })
          .catch(() => undefined)
      }
      if (tokens?.deviceId) {
        await devicesApi.unregister(tokens.deviceId).catch(() => undefined)
      }
    } finally {
      await unregisterPush().catch(() => undefined)
      await clearTokens()
      set({ user: null })
    }
  },

  setUser: (u) => set({ user: u }),
}))
