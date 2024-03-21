import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItem } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NFTItemsContext'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { GridItem } from './GridItem'
import { NftGridLoader } from './NftGridLoader'

type Props = {
  onItemSelected: (item: NFTItem) => void
}

export const NftGrid = ({ onItemSelected }: Props): JSX.Element => {
  const {
    filteredNftItems,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isNftsLoading,
    isNftsRefetching,
    refetchNfts
  } = useNftItemsContext()

  const onEndReached = (): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  if (isNftsLoading)
    return (
      <View sx={{ paddingHorizontal: 16 }}>
        <NftGridLoader />
      </View>
    )

  return (
    <FlatList
      data={filteredNftItems}
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
      onRefresh={refetchNfts}
      refreshing={isNftsRefetching}
      refreshControl={
        <RefreshControl onRefresh={refetchNfts} refreshing={isNftsRefetching} />
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
