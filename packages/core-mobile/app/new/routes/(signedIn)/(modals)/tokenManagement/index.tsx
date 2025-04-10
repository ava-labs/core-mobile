import React, { useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { LocalTokenWithBalance } from 'store/balance/types'
import {
  Icons,
  SearchBar,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import { useRouter } from 'expo-router'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { FlatList } from 'react-native-gesture-handler'
import TokenManagementItem from 'features/portfolio/assets/components/TokenManagementItem'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'

const TokenManagementScreen = (): JSX.Element => {
  const {
    filteredTokenList,
    searchText,
    setSearchText,
    refetch,
    isRefetching,
    isLoading
  } = useSearchableTokenList({ hideBlacklist: false })
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

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 52, marginRight: -16 }} />
  }, [])

  const renderContent = useCallback(() => {
    if (isLoading || isRefetching) {
      return <LoadingState sx={{ flex: 1 }} />
    }

    if (tokenList.length === 0) {
      return (
        <ErrorState
          sx={{ flex: 1 }}
          title="No assets yet"
          description="Add your crypto tokens to track your portfolio’s performance and stay
      updated on your investments"
        />
      )
    }

    return (
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ width: '100%' }}
        data={tokenList}
        ItemSeparatorComponent={renderSeparator}
        renderItem={item =>
          renderItem(item as ListRenderItemInfo<LocalTokenWithBalance>)
        }
        onRefresh={refetch}
        refreshing={false}
        keyExtractor={item => (item as LocalTokenWithBalance).localId}
        keyboardDismissMode="interactive"
      />
    )
  }, [isLoading, isRefetching, tokenList, refetch, renderSeparator])

  const addCustomToken = (): void => {
    push('/tokenManagement/addCustomToken')
  }

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
          paddingHorizontal: 16
        }}>
        <Text variant="heading2">Manage list</Text>
        <TouchableOpacity onPress={addCustomToken} hitSlop={16}>
          <Icons.Content.Add color={colors.$textPrimary} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          paddingHorizontal: 16
        }}>
        <SearchBar onTextChanged={handleSearch} searchText={searchText} />
      </View>
      {renderContent()}
    </View>
  )
}

export default TokenManagementScreen
