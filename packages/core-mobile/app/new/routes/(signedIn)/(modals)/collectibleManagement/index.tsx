import { SearchBar, Text, View } from '@avalabs/k2-alpine'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { LoadingState } from 'common/components/LoadingState'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { CollectibleManagementItem } from 'features/portfolio/collectibles/components/CollectibleManagementItem'
import { LIST_ITEM_HEIGHT } from 'features/portfolio/collectibles/consts'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { useCallback, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NFTItem } from 'store/nft'

const CollectibleManagementScreen = (): JSX.Element => {
  const insets = useSafeAreaInsets()
  const {
    collectibles,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch
  } = useCollectiblesContext()

  const [searchText, setSearchText] = useState('')

  const filteredCollectibles = useMemo(() => {
    if (searchText.length)
      return collectibles?.filter(
        collectible =>
          collectible.processedMetadata?.name
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          collectible.processedMetadata?.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      )
    return collectibles || []
  }, [collectibles, searchText])

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const renderItem: ListRenderItem<NFTItem> = ({
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
        gap: 16,
        paddingHorizontal: 16
      }}>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <Text variant="heading2">Manage list</Text>
      </View>

      <SearchBar onTextChanged={handleSearch} searchText={searchText} />

      <FlashList
        keyExtractor={item => `collectibles-manage-${item.uid}`}
        data={filteredCollectibles}
        renderItem={renderItem}
        estimatedItemSize={LIST_ITEM_HEIGHT}
        ListEmptyComponent={renderEmpty}
        onRefresh={refetch}
        onEndReached={onEndReached}
        refreshing={false}
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
