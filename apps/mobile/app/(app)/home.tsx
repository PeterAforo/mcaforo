import { useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { Card, Heading, Muted, Screen } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { registerForPush } from '@/lib/push'

export default function HomeScreen() {
  const user = useAuth((s) => s.user)

  useEffect(() => {
    // Request push permission after the user has seen value (first home view).
    registerForPush().catch(() => undefined)
  }, [])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <Screen style={{ paddingTop: 16, paddingBottom: 32 }}>
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <Muted>Welcome back,</Muted>
          <Heading>{user?.firstName ?? 'there'}</Heading>
        </View>

        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600' }}>
            Get started
          </Text>
          <View style={{ marginTop: 6 }}>
            <Muted>Review your invoices, track projects, and get support.</Muted>
          </View>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600' }}>
            Latest activity
          </Text>
          <View style={{ marginTop: 6 }}>
            <Muted>No recent activity yet.</Muted>
          </View>
        </Card>
      </Screen>
    </ScrollView>
  )
}
