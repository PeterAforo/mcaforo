import { FlatList, RefreshControl, Text, View } from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'

import { Card, Heading, Muted, Screen } from '@/components/ui'
import { portal, Invoice } from '@/api/endpoints'
import { colors } from '@/theme/tokens'

export default function InvoicesScreen() {
  const query = useInfiniteQuery({
    queryKey: ['invoices'],
    queryFn: ({ pageParam }) => portal.invoices({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const items = (query.data?.pages.flatMap((p) => p.items) ?? []) as Invoice[]

  return (
    <Screen style={{ paddingTop: 16 }}>
      <View style={{ marginBottom: 12 }}>
        <Heading>Invoices</Heading>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        onEndReachedThreshold={0.4}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        refreshControl={
          <RefreshControl
            tintColor={colors.textSecondary}
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
          />
        }
        ListEmptyComponent={
          !query.isLoading ? (
            <Card>
              <Muted>No invoices yet.</Muted>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#F9FAFB', fontWeight: '600' }}>{item.invoiceNumber}</Text>
              <Text style={{ color: colors.mcaforoOrange, fontWeight: '700' }}>
                {item.currency} {item.total}
              </Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <Muted>
                {item.status} · {item.dueDate ? `Due ${new Date(item.dueDate).toLocaleDateString()}` : 'No due date'}
              </Muted>
            </View>
          </Card>
        )}
      />
    </Screen>
  )
}
