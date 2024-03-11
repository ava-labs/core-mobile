import React, { useCallback } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItemData, NFTImageData, NFTMetadata } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { useGetNftImageData } from 'screens/nft/hooks/useGetNftImageData'
import { useGetNftMetadata } from 'screens/nft/hooks/useGetNftMetadata'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { NftListLoader } from './NftListLoader'
import { ListItem } from './ListItem'

type Props = {
  nfts: NFTItemData[]
  onItemSelected: (item: NFTItemData) => void
  isLoading: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  refresh: () => void
  isRefreshing: boolean
}

export const NftList = ({
  nfts,
  onItemSelected,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refresh,
  isRefreshing
}: Props): JSX.Element => {
  const { getNftImageData } = useGetNftImageData()
  const { getNftMetadata } = useGetNftMetadata()

  const onEndReached = useCallback(
    ({ distanceFromEnd }: { distanceFromEnd: number }) => {
      if (distanceFromEnd > 0 && hasNextPage && !isFetchingNextPage)
        fetchNextPage()
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  if (isLoading)
    return (
      <View sx={{ paddingHorizontal: 16 }}>
        <NftListLoader />
      </View>
    )

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
      ListFooterComponent={
        <FetchingNextIndicator isVisible={isFetchingNextPage} />
      }
      renderItem={info =>
        renderItem({
          item: info.item,
          metadata: getNftMetadata(info.item),
          onItemSelected,
          imageData: getNftImageData(info.item)
        })
      }
      indicatorStyle="white"
      refreshControl={
        <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
      }
    />
  )
}

const renderItem = ({
  item,
  metadata,
  onItemSelected,
  imageData
}: {
  item: NFTItemData
  metadata: NFTMetadata
  onItemSelected: (item: NFTItemData) => void
  imageData?: NFTImageData
}): JSX.Element => {
  return (
    <ListItem
      item={item}
      metadata={metadata}
      onItemSelected={onItemSelected}
      imageData={imageData}
    />
  )
}

const Separator = (): JSX.Element => <View style={{ margin: 4 }} />

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: '20%'
  }
})
