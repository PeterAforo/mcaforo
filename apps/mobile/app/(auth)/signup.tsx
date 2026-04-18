import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'

import { Button, Field, Heading, Muted, Screen } from '@/components/ui'
import { auth as authApi } from '@/api/endpoints'
import { apiMessage } from '@/api/client'

export default function SignupScreen() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function set<K extends keyof typeof form>(k: K) {
    return (v: string) => setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit() {
    setError(null)
    setLoading(true)
    try {
      await authApi.signup({ ...form, verificationRedirect: 'mobile' })
      setDone(true)
    } catch (err) {
      setError(apiMessage(err, 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Screen style={{ paddingTop: 120 }}>
        <Heading>Check your email</Heading>
        <View style={{ marginTop: 12, marginBottom: 24 }}>
          <Muted>
            We sent a verification link to {form.email}. Open it on this device to finish creating
            your account.
          </Muted>
        </View>
        <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen style={{ paddingTop: 64, paddingBottom: 24 }}>
          <Heading>Create account</Heading>
          <View style={{ marginTop: 8, marginBottom: 24 }}>
            <Muted>Get started with McAforo in under a minute.</Muted>
          </View>

          <Field label="First name" value={form.firstName} onChangeText={set('firstName')} />
          <Field label="Last name" value={form.lastName} onChangeText={set('lastName')} />
          <Field
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={set('email')}
          />
          <Field label="Company name" value={form.companyName} onChangeText={set('companyName')} />
          <Field
            label="Password"
            secureTextEntry
            value={form.password}
            onChangeText={set('password')}
            placeholder="Min. 8 characters"
          />

          {error ? (
            <Text style={{ color: '#EF4444', marginBottom: 12 }}>{error}</Text>
          ) : null}

          <Button title="Create account" onPress={onSubmit} loading={loading} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
            <Muted>Have an account?</Muted>
            <Link href="/(auth)/login" style={{ color: '#F26522', fontWeight: '500' }}>
              Sign in
            </Link>
          </View>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
