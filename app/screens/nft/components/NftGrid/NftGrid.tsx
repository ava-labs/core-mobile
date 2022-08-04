import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import MasonryList from '@react-native-seoul/masonry-list'
import { NFTItemData } from 'store/nft'
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
}: Props) => {
  const [endReachedDuringMomentum, setEndReachedDuringMomentum] = useState(true)

  const onEndReached = () => {
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
    <MasonryList
      data={nfts}
      contentContainerStyle={styles.contentContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
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
    />
  )
}

const renderItem = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void
) => {
  return <GridItem item={item} onItemSelected={onItemSelected} />
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: '20%'
  }
})
