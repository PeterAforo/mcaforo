import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'

import { Button, Field, Heading, Muted, Screen } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { apiMessage } from '@/api/client'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    try {
      await login(email.trim(), password)
      router.replace('/(app)/home')
    } catch (err) {
      setError(apiMessage(err, 'Unable to sign in'))
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen style={{ paddingTop: 80, paddingBottom: 24 }}>
          <View style={{ marginBottom: 32 }}>
            <Heading>Welcome back</Heading>
            <View style={{ marginTop: 8 }}>
              <Muted>Sign in to continue to your McAforo account.</Muted>
            </View>
          </View>

          <Field
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
          />

          {error ? (
            <Text style={{ color: '#EF4444', marginBottom: 12 }}>{error}</Text>
          ) : null}

          <Button title="Sign in" onPress={onSubmit} loading={loading} />

          <View style={{ alignItems: 'center', marginTop: 16, gap: 8 }}>
            <Link href="/(auth)/forgot-password" style={{ color: '#F26522', fontWeight: '500' }}>
              Forgot password?
            </Link>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Muted>No account?</Muted>
              <Link href="/(auth)/signup" style={{ color: '#F26522', fontWeight: '500' }}>
                Create one
              </Link>
            </View>
          </View>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
