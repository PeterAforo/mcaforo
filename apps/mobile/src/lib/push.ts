import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import { Platform } from 'react-native'

import { devices as devicesApi } from '@/api/endpoints'
import { getOrCreateDeviceId } from '@/store/secure-storage'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Request notification permission, fetch the Expo push token, and register it
 * with the server for the current user. Safe to call on every login.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null // Simulators can't receive push

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F26522',
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync()
    status = asked.status
  }
  if (status !== 'granted') return null

  let pushToken: string | null = null
  try {
    const token = await Notifications.getExpoPushTokenAsync()
    pushToken = token.data
  } catch {
    return null
  }

  const deviceId = await getOrCreateDeviceId()
  await devicesApi
    .register({
      deviceId,
      platform: Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB',
      pushToken,
      appVersion: Application.nativeApplicationVersion ?? undefined,
      osVersion: Device.osVersion ?? undefined,
      model: Device.modelName ?? undefined,
    })
    .catch(() => undefined)

  return pushToken
}

export async function unregisterPush(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0)
  } catch {
    // no-op
  }
}
