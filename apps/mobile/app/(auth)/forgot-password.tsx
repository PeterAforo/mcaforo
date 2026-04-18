import { useState } from 'react'
import { Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'

import { Button, Field, Heading, Muted, Screen } from '@/components/ui'
import { auth as authApi } from '@/api/endpoints'
import { apiMessage } from '@/api/client'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(apiMessage(err, 'Unable to send reset email'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen style={{ paddingTop: 80 }}>
      <Heading>Reset password</Heading>
      <View style={{ marginTop: 8, marginBottom: 24 }}>
        <Muted>Enter your email and we&apos;ll send you a reset link.</Muted>
      </View>

      {sent ? (
        <>
          <View style={{ marginBottom: 16 }}>
            <Muted>If an account exists for that email, a reset link is on its way.</Muted>
          </View>
          <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
        </>
      ) : (
        <>
          <Field
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {error ? <Text style={{ color: '#EF4444', marginBottom: 12 }}>{error}</Text> : null}
          <Button title="Send reset link" loading={loading} onPress={onSubmit} />
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Link href="/(auth)/login" style={{ color: '#F26522', fontWeight: '500' }}>
              Back to sign in
            </Link>
          </View>
        </>
      )}
    </Screen>
  )
}
