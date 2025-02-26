import React, { useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { LocalTokenWithBalance } from 'store/balance/types'
import {
  Icons,
  SearchBar,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { GlobalLoadingState } from 'common/components/GlobalLoadingState'
import { GlobalEmptyAssets } from 'common/components/GlobalEmptyState'
import { TokenType } from '@avalabs/vm-module-types'
import { useRouter } from 'expo-router'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { FlatList } from 'react-native-gesture-handler'
import TokenManagementItem from 'features/portfolio/assets/components/TokenManagementItem'

const TokenManagementScreen = (): JSX.Element => {
  const {
    filteredTokenList,
    searchText,
    setSearchText,
    refetch,
    isRefetching,
    isLoading
  } = useSearchableTokenList({ hideZeroBalance: true, hideBlacklist: false })
  const {
    theme: { colors }
  } = useTheme()
  const { push } = useRouter()

  // only show erc20 tokens here
  const tokenList = filteredTokenList.filter(
    token => token.type !== TokenType.NATIVE
  )

  const renderItem = (
    item: ListRenderItemInfo<LocalTokenWithBalance>
  ): JSX.Element => {
    const token = item.item
    return <TokenManagementItem token={token} />
  }

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  const renderContent = useCallback(() => {
    if (isLoading || isRefetching) {
      return <GlobalLoadingState />
    }

    if (tokenList.length === 0) {
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
        data={tokenList}
        renderItem={item =>
          renderItem(item as ListRenderItemInfo<LocalTokenWithBalance>)
        }
        onRefresh={refetch}
        refreshing={false}
        keyExtractor={item => (item as LocalTokenWithBalance).localId}
        keyboardDismissMode="interactive"
      />
    )
  }, [isLoading, isRefetching, tokenList, refetch])

  const addCustomToken = (): void => {
    push('/tokenManagement/addCustomToken')
  }

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
        <TouchableOpacity onPress={addCustomToken} hitSlop={16}>
          <Icons.Content.Add color={colors.$textPrimary} />
        </TouchableOpacity>
      </View>
      <SearchBar onTextChanged={handleSearch} searchText={searchText} />
      {renderContent()}
    </View>
  )
}

export default TokenManagementScreen
