import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTImageData, NFTItemData, NFTMetadata } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import {
  useGetNftImageData,
  useGetNftMetadata
} from 'screens/nft/hooks/useGetNftMetadata'
import { View } from '@avalabs/k2-mobile'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { GridItem } from './GridItem'
import { NftGridLoader } from './NftGridLoader'

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
  const { getNftImageData } = useGetNftImageData()
  const { getNftMetadata } = useGetNftMetadata()

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
          metadata: getNftMetadata(info.item),
          onItemSelected,
          imageData: getNftImageData(info.item)
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
    <GridItem
      item={item}
      metadata={metadata}
      imageData={imageData}
      onItemSelected={onItemSelected}
    />
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: '20%'
  }
})
