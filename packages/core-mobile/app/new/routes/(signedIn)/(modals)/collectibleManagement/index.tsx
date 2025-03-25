import { SearchBar, Text, Toggle, View } from '@avalabs/k2-alpine'
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
import { useDispatch, useSelector } from 'react-redux'
import { NftItem } from 'services/nft/types'
import {
  selectCollectibleUnprocessableVisibility,
  toggleCollectibleUnprocessableVisibility
} from 'store/portfolio'

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
        flex: 1
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
        ListHeaderComponent={<CollectibleManagementOptions />}
        contentContainerStyle={{
          paddingBottom: insets.bottom
        }}
      />
    </View>
  )
}

const CollectibleManagementOptions = () => {
  const collectibleUnprocessableVisibility = useSelector(
    selectCollectibleUnprocessableVisibility
  )
  const dispatch = useDispatch()

  function handleChange(): void {
    dispatch(toggleCollectibleUnprocessableVisibility())
  }

  return (
    <View
      style={{
        paddingLeft: HORIZONTAL_MARGIN
      }}>
      <View
        sx={{
          borderBottomWidth: 1,
          borderColor: '$borderPrimary',
          height: 56,
          paddingRight: HORIZONTAL_MARGIN,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row'
        }}>
        <Text>Hide unreachable collectibles</Text>
        <Toggle
          value={collectibleUnprocessableVisibility}
          onValueChange={handleChange}
        />
      </View>
    </View>
  )
}

export default CollectibleManagementScreen
