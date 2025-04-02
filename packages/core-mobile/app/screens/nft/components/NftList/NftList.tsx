import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ZeroState from 'components/ZeroState'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NftItemsContext'
import { NftItem } from 'services/nft/types'
import { NftListLoader } from './NftListLoader'
import { ListItem } from './ListItem'

type Props = {
  onItemSelected: (item: NftItem) => void
}

export const NftList = ({ onItemSelected }: Props): JSX.Element => {
  const { filteredNftItems, isNftsLoading, isNftsRefetching, refetchNfts } =
    useNftItemsContext()

  if (isNftsLoading)
    return (
      <View sx={{ paddingHorizontal: 16 }}>
        <NftListLoader />
      </View>
    )

  return (
    <FlatList
      testID="nft_list_view"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={filteredNftItems}
      ListEmptyComponent={<ZeroState.Collectibles />}
      keyExtractor={item => item.tokenId}
      ItemSeparatorComponent={Separator}
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
  item: NftItem
  onItemSelected: (item: NftItem) => void
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
