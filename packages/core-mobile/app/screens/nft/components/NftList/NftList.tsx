import React, { useCallback } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItem } from 'store/nft'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NFTItemsContext'
import { FetchingNextIndicator } from '../FetchingNextIndicator'
import { NftListLoader } from './NftListLoader'
import { ListItem } from './ListItem'

type Props = {
  onItemSelected: (item: NFTItem) => void
}

export const NftList = ({ onItemSelected }: Props): JSX.Element => {
  const {
    filteredNftItems,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isNftsLoading,
    isNftsRefetching,
    refetchNfts
  } = useNftItemsContext()

  const onEndReached = useCallback(
    ({ distanceFromEnd }: { distanceFromEnd: number }) => {
      if (distanceFromEnd > 0 && hasNextPage && !isFetchingNextPage)
        fetchNextPage()
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  if (isNftsLoading)
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
      data={filteredNftItems}
      ListEmptyComponent={<ZeroState.Collectibles />}
      keyExtractor={item => item.uid}
      ItemSeparatorComponent={Separator}
      ListFooterComponent={
        <FetchingNextIndicator isVisible={isFetchingNextPage} />
      }
      renderItem={info =>
        renderItem({
          item: info.item,
          onItemSelected
        })
      }
      indicatorStyle="white"
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
  return <ListItem item={item} onItemSelected={onItemSelected} />
}

const Separator = (): JSX.Element => <View style={{ margin: 4 }} />

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: '20%'
  }
})
