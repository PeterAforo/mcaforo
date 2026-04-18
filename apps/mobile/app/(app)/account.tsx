import { useEffect, useState } from 'react'
import { ScrollView, Switch, Text, View } from 'react-native'

import { Button, Card, Heading, Muted, Screen } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { colors } from '@/theme/tokens'
import {
  isBiometricHardwareAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
} from '@/lib/biometrics'

export default function AccountScreen() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(false)

  useEffect(() => {
    isBiometricHardwareAvailable().then(setBioAvailable)
    isBiometricEnabled().then(setBioEnabled)
  }, [])

  async function toggleBio(next: boolean) {
    setBioEnabled(next)
    await setBiometricEnabled(next)
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <Screen style={{ paddingTop: 16, paddingBottom: 32 }}>
        <Heading>Account</Heading>

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <View style={{ marginTop: 4 }}>
            <Muted>{user?.email}</Muted>
          </View>
          {user?.roles?.length ? (
            <View style={{ marginTop: 8, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {user.roles.map((r) => (
                <View
                  key={r}
                  style={{
                    backgroundColor: colors.mcaforoOrange + '22',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: colors.mcaforoOrange, fontSize: 12, fontWeight: '600' }}>
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {bioAvailable ? (
          <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                Unlock with biometrics
              </Text>
              <Muted>Use Face ID / fingerprint to unlock McAforo.</Muted>
            </View>
            <Switch
              value={bioEnabled}
              onValueChange={toggleBio}
              trackColor={{ false: colors.border, true: colors.mcaforoOrange }}
            />
          </Card>
        ) : null}

        <View style={{ marginTop: 24 }}>
          <Button title="Sign out" variant="secondary" onPress={logout} />
        </View>
      </Screen>
    </ScrollView>
  )
}
