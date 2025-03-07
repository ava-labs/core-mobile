import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NftItemsContext'
import { NftItem } from 'services/nft/types'
import { GridItem } from './GridItem'
import { NftGridLoader } from './NftGridLoader'

type Props = {
  onItemSelected: (item: NftItem) => void
}

export const NftGrid = ({ onItemSelected }: Props): JSX.Element => {
  const { filteredNftItems, isNftsLoading, isNftsRefetching, refetchNfts } =
    useNftItemsContext()

  if (isNftsLoading)
    return (
      <View sx={{ paddingHorizontal: 16 }}>
        <NftGridLoader />
      </View>
    )

  return (
    <FlatList
      testID="nft_grid_view"
      data={filteredNftItems}
      contentContainerStyle={styles.contentContainer}
      keyExtractor={item => item.tokenId}
      ListEmptyComponent={<ZeroState.Collectibles />}
      numColumns={2}
      showsVerticalScrollIndicator={true}
      renderItem={({ item }) =>
        renderItem({
          item,
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
  item: NftItem
  onItemSelected: (item: NftItem) => void
}): JSX.Element => {
  return (
    <GridItem
      item={item}
      onItemSelected={onItemSelected}
      testID="nft_grid_item"
    />
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: '20%'
  }
})
