import React, { useCallback } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItemData } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { NftListLoader } from './NftListLoader'
import { ListItem } from './ListItem'

type Props = {
  nfts: NFTItemData[]
  onItemSelected: (item: NFTItemData) => void
  isLoading: boolean
  fetchNext: () => void
  isFetchingNext: boolean
  refresh: () => void
  isRefreshing: boolean
}

export const NftList = ({
  nfts,
  onItemSelected,
  isLoading,
  fetchNext,
  isFetchingNext,
  refresh,
  isRefreshing
}: Props) => {
  const onEndReached = useCallback(
    ({ distanceFromEnd }: { distanceFromEnd: number }) => {
      if (distanceFromEnd > 0) fetchNext()
    },
    [fetchNext]
  )

  if (isLoading) return <NftListLoader />

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
      data={nfts}
      ListEmptyComponent={<ZeroState.Collectibles />}
      keyExtractor={item => item.uid}
      ItemSeparatorComponent={Separator}
      ListFooterComponent={<FetchingNextIndicator isVisible={isFetchingNext} />}
      renderItem={info => renderItem(info.item, onItemSelected)}
      indicatorStyle="white"
      refreshControl={
        <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
      }
    />
  )
}

const renderItem = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void
) => {
  return <ListItem item={item} onItemSelected={onItemSelected} />
}

const Separator = () => <View style={{ margin: 4 }} />

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingBottom: '20%'
  }
})
