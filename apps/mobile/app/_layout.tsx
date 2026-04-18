import '../global.css'
import { useEffect } from 'react'
import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuth } from '@/store/auth'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false },
  },
})

function AuthGate() {
  const { user, hydrated, hydrate } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    hydrate().finally(() => SplashScreen.hideAsync().catch(() => undefined))
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(app)/home')
    }
  }, [user, hydrated, segments, router])

  return <Slot />
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
