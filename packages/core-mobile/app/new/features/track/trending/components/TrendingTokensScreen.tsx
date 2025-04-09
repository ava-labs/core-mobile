import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { Separator, Text } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { MarketToken } from 'store/watchlist'
import { TrendingTokenListItem } from '../../components/TrendingTokenListItem'

const numColumns = 1
const estimatedItemSize = 120

const TrendingTokensScreen = ({
  data,
  goToMarketDetail,
  emptyComponent
}: {
  data: MarketToken[]
  goToMarketDetail: (tokenId: string) => void
  emptyComponent: React.JSX.Element
}): JSX.Element => {
  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: MarketToken
      index: number
    }): React.JSX.Element => {
      return (
        <TrendingTokenListItem
          token={item}
          index={index}
          onPress={() => goToMarketDetail(item.id)}
        />
      )
    },
    [goToMarketDetail]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 62 }} />
  }, [])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <Text variant="heading3" style={styles.headerContainer}>
        Trending tokens
      </Text>
    )
  }, [])

  return (
    <CollapsibleTabs.FlashList
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.container}
      data={data}
      numColumns={numColumns}
      renderItem={renderItem}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={'list'}
      keyExtractor={item => item.id}
      removeClippedSubviews={true}
      estimatedItemSize={estimatedItemSize}
    />
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  dropdownContainer: { paddingHorizontal: 16 },
  dropdown: { marginTop: 14, marginBottom: 16 },
  headerContainer: {
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 16
  }
})

export default TrendingTokensScreen
