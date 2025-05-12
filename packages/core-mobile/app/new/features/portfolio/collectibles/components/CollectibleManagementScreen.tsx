import { SearchBar, Text, Toggle, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { LoadingState } from 'common/components/LoadingState'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { ListRenderItem } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { NftItem } from 'services/nft/types'
import {
  selectCollectibleUnprocessableVisibility,
  toggleCollectibleUnprocessableVisibility
} from 'store/portfolio'
import { useCollectiblesContext } from '../CollectiblesContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { CollectibleManagementItem } from './CollectibleManagementItem'

export const CollectibleManagementScreen = (): ReactNode => {
  const { collectibles, isLoading, isRefetching, refetch } =
    useCollectiblesContext()

  const [searchText, setSearchText] = useState('')

  const filteredCollectibles = useMemo(() => {
    if (searchText.length)
      return collectibles?.filter(
        collectible =>
          collectible?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          collectible?.collectionName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      )
    return collectibles
  }, [collectibles, searchText])

  const handleSearch = useCallback((text: string): void => {
    setSearchText(text)
  }, [])

  const renderItem: ListRenderItem<NftItem> = ({
    item,
    index
  }): JSX.Element => {
    return <CollectibleManagementItem index={index} collectible={item} />
  }

  const renderEmpty = useCallback(() => {
    if (isLoading || isRefetching) return <LoadingState />
    return (
      <ErrorState
        title="No collectibles found"
        description="Try searching for a different collectible"
        sx={{ height: portfolioTabContentHeight }}
      />
    )
  }, [isLoading, isRefetching])

  const renderHeader = useCallback(() => {
    return (
      <View
        style={{
          gap: 16
        }}>
        <SearchBar onTextChanged={handleSearch} searchText={searchText} />
        <CollectibleManagementOptions />
      </View>
    )
  }, [handleSearch, searchText])

  return (
    <ListScreen
      title="Manage list"
      keyExtractor={item => `collectibles-manage-${item.localId}`}
      data={filteredCollectibles}
      renderItem={renderItem}
      renderHeader={renderHeader}
      onRefresh={refetch}
      refreshing={isRefetching}
      renderEmpty={renderEmpty}
    />
  )
}

const CollectibleManagementOptions = (): ReactNode => {
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
