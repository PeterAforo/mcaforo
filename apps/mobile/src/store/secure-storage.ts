import * as SecureStore from 'expo-secure-store'

const KEY_ACCESS = 'mcaforo.access_token'
const KEY_REFRESH = 'mcaforo.refresh_token'
const KEY_DEVICE = 'mcaforo.device_id'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  deviceId?: string
}

export async function saveTokens(t: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, t.accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, t.refreshToken),
    t.deviceId ? SecureStore.setItemAsync(KEY_DEVICE, t.deviceId) : Promise.resolve(),
  ])
}

export async function getTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken, deviceId] = await Promise.all([
    SecureStore.getItemAsync(KEY_ACCESS),
    SecureStore.getItemAsync(KEY_REFRESH),
    SecureStore.getItemAsync(KEY_DEVICE),
  ])
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken, deviceId: deviceId ?? undefined }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
    // Keep deviceId so push token stays stable across logout/login cycles.
  ])
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_DEVICE)
  if (existing) return existing
  const fresh =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto?.randomUUID?.() ??
    `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  await SecureStore.setItemAsync(KEY_DEVICE, fresh)
  return fresh
}
