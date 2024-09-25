import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItem } from 'store/nft'
import { useNftItemsContext } from 'contexts/NFTItemsContext'
import { GridItem } from './GridItem'

type Props = {
  onItemSelected: (item: NFTItem) => void
}

export const NftGrid = ({ onItemSelected }: Props): JSX.Element => {
  const { filteredNftItems } = useNftItemsContext()

  return (
    <FlatList
      testID="nft_grid_view"
      data={filteredNftItems}
      contentContainerStyle={styles.contentContainer}
      keyExtractor={item => item.uid}
      ListEmptyComponent={<ZeroState.Collectibles />}
      numColumns={2}
      showsVerticalScrollIndicator={true}
      renderItem={info =>
        renderItem({
          item: info.item,
          onItemSelected
        })
      }
      indicatorStyle="white"
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
