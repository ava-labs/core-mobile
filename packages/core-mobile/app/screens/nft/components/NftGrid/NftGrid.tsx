import React, { useState } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItemData } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { GridItem } from './GridItem'
import { NftGridLoader } from './NftGridLoader'

type Props = {
  nfts: NFTItemData[]
  onItemSelected: (item: NFTItemData) => void
  isLoading: boolean
  fetchNext: () => void
  isFetchingNext: boolean
  refresh: () => void
  isRefreshing: boolean
}

export const NftGrid = ({
  nfts,
  onItemSelected,
  isLoading,
  fetchNext,
  isFetchingNext,
  refresh,
  isRefreshing
}: Props): JSX.Element => {
  const [endReachedDuringMomentum, setEndReachedDuringMomentum] = useState(true)

  const onEndReached = (): void => {
    // using endReachedDuringMomentum to prevent onEndReached from firing multiple times
    // this is a bug with mansorylist
    // https://github.com/hyochan/react-native-masonry-list/issues/11
    if (!endReachedDuringMomentum) {
      fetchNext()
      setEndReachedDuringMomentum(true)
    }
  }

  if (isLoading) return <NftGridLoader />

  return (
    <FlatList
      data={nfts}
      contentContainerStyle={styles.contentContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      onMomentumScrollBegin={() => setEndReachedDuringMomentum(false)}
      keyExtractor={item => item.uid}
      ListEmptyComponent={<ZeroState.Collectibles />}
      ListFooterComponent={<FetchingNextIndicator isVisible={isFetchingNext} />}
      numColumns={2}
      showsVerticalScrollIndicator={true}
      renderItem={info => renderItem(info.item, onItemSelected)}
      indicatorStyle="white"
      onRefresh={refresh}
      refreshing={isRefreshing}
      refreshControl={
        <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
      }
    />
  )
}

const renderItem = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void
): JSX.Element => {
  return <GridItem item={item} onItemSelected={onItemSelected} />
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: '20%'
  }
})
