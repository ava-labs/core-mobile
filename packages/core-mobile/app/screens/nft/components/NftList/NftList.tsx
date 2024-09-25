import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { NFTItem } from 'store/nft'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NFTItemsContext'
import { ListItem } from './ListItem'

type Props = {
  onItemSelected: (item: NFTItem) => void
}

export const NftList = ({ onItemSelected }: Props): JSX.Element => {
  const { filteredNftItems } = useNftItemsContext()

  return (
    <FlatList
      testID="nft_list_view"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={filteredNftItems}
      ListEmptyComponent={<ZeroState.Collectibles />}
      keyExtractor={item => item.uid}
      ItemSeparatorComponent={Separator}
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
    <ListItem testID="nft_item" item={item} onItemSelected={onItemSelected} />
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
