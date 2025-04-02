import {
  alpha,
  SearchBar,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from 'react-native'
import { LoadingState } from 'common/components/LoadingState'
import { LinearGradient } from 'expo-linear-gradient'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { ReactNode, useMemo, useState } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
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

      <View
        style={{
          flex: 1
        }}>
        <LinearGradient
          colors={[
            alpha(theme.colors.$surfacePrimary, 1),
            alpha(theme.colors.$surfacePrimary, 0)
          ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            zIndex: 10
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
        <FlatList
          keyExtractor={item => `collectibles-manage-${item.localId}`}
          data={filteredCollectibles}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          onRefresh={refetch}
          refreshing={isRefetching}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          ListHeaderComponent={<CollectibleManagementOptions />}
          contentContainerStyle={{
            paddingBottom: insets.bottom
          }}
        />
      </View>
    </View>
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
