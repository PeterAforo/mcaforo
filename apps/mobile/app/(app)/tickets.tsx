import { ScrollView } from 'react-native'
import { Card, Heading, Muted, Screen } from '@/components/ui'

export default function TicketsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <Screen style={{ paddingTop: 16, paddingBottom: 32 }}>
        <Heading>Support Tickets</Heading>
        <Card style={{ marginTop: 16 }}>
          <Muted>Your open and recent tickets will appear here.</Muted>
        </Card>
      </Screen>
    </ScrollView>
  )
}
