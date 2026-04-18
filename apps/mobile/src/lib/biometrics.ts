import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const KEY_ENABLED = 'mcaforo.biometrics_enabled'

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ])
  return hasHardware && isEnrolled
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY_ENABLED)) === '1'
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY_ENABLED, enabled ? '1' : '0')
}

export async function authenticateBiometric(
  reason = 'Unlock McAforo'
): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use password',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  })
  return res.success
}
