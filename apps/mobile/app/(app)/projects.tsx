import { ScrollView } from 'react-native'
import { Card, Heading, Muted, Screen } from '@/components/ui'

export default function ProjectsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <Screen style={{ paddingTop: 16, paddingBottom: 32 }}>
        <Heading>Projects</Heading>
        <Card style={{ marginTop: 16 }}>
          <Muted>Your active projects will appear here once the projects API exposes a cursor-paginated endpoint.</Muted>
        </Card>
      </Screen>
    </ScrollView>
  )
}
