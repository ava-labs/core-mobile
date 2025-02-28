import {
  Icons,
  SearchBar,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { GlobalEmptyAssets } from 'common/components/GlobalEmptyState'
import { GlobalLoadingState } from 'common/components/GlobalLoadingState'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useRouter } from 'expo-router'
import { CollectibleGridItem } from 'features/portfolio/collectibles/components/CollectibleItem'
import React, { useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { CollectibleView } from 'store/balance/types'
import { NFTItem } from 'store/nft'

const CollectibleManagementScreen = (): JSX.Element => {
  const {
    filteredTokenList,
    searchText,
    setSearchText,
    refetch,
    isRefetching,
    isLoading
  } = useSearchableTokenList(true, false)

  const {
    theme: { colors }
  } = useTheme()
  const { push } = useRouter()

  // only show erc20 tokens here

  const renderItem = (item: ListRenderItemInfo<NFTItem>): JSX.Element => {
    return (
      <CollectibleGridItem
        index={item.index}
        collectible={item.item}
        type={CollectibleView.ListView}
      />
    )
  }

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  const renderContent = useCallback(() => {
    if (isLoading || isRefetching) {
      return <GlobalLoadingState />
    }

    if (filteredTokenList.length === 0) {
      return (
        <GlobalEmptyAssets
          title="No Assets yet"
          description="Add your crypto tokens to track your portfolio’s performance and stay
      updated on your investments"
        />
      )
    }

    return (
      <FlatList
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
        data={filteredTokenList}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={false}
        keyExtractor={item => item.uid}
        keyboardDismissMode="interactive"
      />
    )
  }, [isLoading, isRefetching, filteredTokenList, refetch])

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
      {renderContent()}
    </View>
  )
}

export default CollectibleManagementScreen
