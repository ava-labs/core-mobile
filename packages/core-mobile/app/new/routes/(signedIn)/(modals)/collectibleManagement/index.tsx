import { SearchBar, Text, View } from '@avalabs/k2-alpine'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { LoadingState } from 'common/components/LoadingState'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { CollectibleManagementItem } from 'features/portfolio/collectibles/components/CollectibleManagementItem'
import {
  HORIZONTAL_MARGIN,
  LIST_ITEM_HEIGHT
} from 'features/portfolio/collectibles/consts'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NftItem } from 'services/nft/types'

const CollectibleManagementScreen = (): JSX.Element => {
  const insets = useSafeAreaInsets()
  const { collectibles, isLoading, isRefetching, refetch } =
    useCollectiblesContext()

  const [searchText, setSearchText] = useState('')

  const filteredCollectibles = useMemo(() => {
    if (searchText.length)
      return collectibles?.filter(
        collectible =>
          collectible?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          collectible?.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          collectible?.collectionName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      )
    return collectibles
  }, [collectibles, searchText])

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  const renderItem: ListRenderItem<NftItem> = ({
    item,
    index
  }): JSX.Element => {
    return <CollectibleManagementItem index={index} collectible={item} />
  }

  const renderEmpty = useMemo(() => {
    if (isLoading || isRefetching) return <LoadingState />
    return <LoadingState sx={{ height: portfolioTabContentHeight }} />
  }, [isLoading, isRefetching])

  return (
    <View
      sx={{
        flex: 1,
        gap: 16
      }}>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: HORIZONTAL_MARGIN
        }}>
        <Text variant="heading2">Manage list</Text>
      </View>

      <SearchBar onTextChanged={handleSearch} searchText={searchText} />

      <FlashList
        keyExtractor={item => `collectibles-manage-${item.localId}`}
        data={filteredCollectibles}
        renderItem={renderItem}
        estimatedItemSize={LIST_ITEM_HEIGHT}
        ListEmptyComponent={renderEmpty}
        onRefresh={refetch}
        refreshing={isRefetching}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom
        }}
      />
    </View>
  )
}

export default CollectibleManagementScreen
