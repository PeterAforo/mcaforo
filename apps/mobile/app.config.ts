import type { ExpoConfig, ConfigContext } from 'expo/config'

/**
 * McAforo mobile app config.
 * Reads environment via process.env.EAS_BUILD_PROFILE (or APP_ENV) to choose
 * API URL + bundle identifiers.
 */
const ENV = process.env.APP_ENV ?? process.env.EAS_BUILD_PROFILE ?? 'development'

const API_URLS: Record<string, string> = {
  development: 'http://10.0.2.2:3000', // Android emulator → host localhost
  preview: 'https://staging.mcaforo.com',
  production: 'https://mcaforo.com',
}

const SUFFIX: Record<string, string> = {
  development: '.dev',
  preview: '.staging',
  production: '',
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: ENV === 'production' ? 'McAforo' : `McAforo (${ENV})`,
  slug: 'mcaforo',
  version: '1.0.0',
  scheme: 'mcaforo',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0f172a',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: `com.mcaforo.app${SUFFIX[ENV] ?? ''}`,
    associatedDomains: ['applinks:mcaforo.com'],
    infoPlist: {
      NSCameraUsageDescription:
        'McAforo uses your camera so you can attach photos to support tickets and update your profile picture.',
      NSPhotoLibraryUsageDescription:
        'McAforo accesses your photos to attach them to tickets and messages.',
      NSFaceIDUsageDescription: 'McAforo uses Face ID to unlock your account securely.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: `com.mcaforo.app${SUFFIX[ENV] ?? ''}`,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f172a',
    },
    permissions: [
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'POST_NOTIFICATIONS',
      'VIBRATE',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'https', host: 'mcaforo.com', pathPrefix: '/app' }],
        category: ['BROWSABLE', 'DEFAULT'],
        autoVerify: true,
      },
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#F26522',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'McAforo accesses your photos to attach them to tickets and messages.',
        cameraPermission:
          'McAforo uses your camera so you can attach photos to support tickets.',
      },
    ],
  ],
  extra: {
    env: ENV,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? API_URLS[ENV] ?? API_URLS.development,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? null,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'REPLACE_ME_AFTER_eas_init',
    },
  },
  experiments: {
    typedRoutes: true,
  },
})
