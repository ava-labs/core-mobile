import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItem } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { GridItem } from './GridItem'
import { NftGridLoader } from './NftGridLoader'

type Props = {
  nfts: NFTItem[]
  onItemSelected: (item: NFTItem) => void
  isLoading: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  refresh: () => void
  isRefreshing: boolean
}

export const NftGrid = ({
  nfts,
  onItemSelected,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refresh,
  isRefreshing
}: Props): JSX.Element => {
  const onEndReached = (): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  if (isLoading)
    return (
      <View sx={{ paddingHorizontal: 16 }}>
        <NftGridLoader />
      </View>
    )

  return (
    <FlatList
      data={nfts}
      contentContainerStyle={styles.contentContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      keyExtractor={item => item.uid}
      ListEmptyComponent={<ZeroState.Collectibles />}
      ListFooterComponent={
        <FetchingNextIndicator isVisible={isFetchingNextPage} />
      }
      numColumns={2}
      showsVerticalScrollIndicator={true}
      renderItem={info =>
        renderItem({
          item: info.item,
          onItemSelected
        })
      }
      indicatorStyle="white"
      onRefresh={refresh}
      refreshing={isRefreshing}
      refreshControl={
        <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
      }
    />
  )
}

const renderItem = ({
  item,
  onItemSelected
}: {
  item: NFTItem
  onItemSelected: (item: NFTItem) => void
}): JSX.Element => {
  return <GridItem item={item} onItemSelected={onItemSelected} />
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: '20%'
  }
})
