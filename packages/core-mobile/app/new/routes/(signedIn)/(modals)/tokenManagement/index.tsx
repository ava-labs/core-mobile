import {
  Icons,
  SearchBar,
  Separator,
  TouchableOpacity,
  useTheme
} from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import { ErrorState } from 'common/components/ErrorState'
import { FlatListScreenTemplate } from 'common/components/FlatListScreenTemplate'
import { LoadingState } from 'common/components/LoadingState'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useRouter } from 'expo-router'
import TokenManagementItem from 'features/portfolio/assets/components/TokenManagementItem'
import React, { useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { LocalTokenWithBalance } from 'store/balance/types'

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

  const handleSearch = useCallback(
    (text: string): void => {
      setSearchText(text)
    },
    [setSearchText]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 52, marginRight: -16 }} />
  }, [])

  const ListEmptyComponent = useCallback(() => {
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
  }, [isLoading, isRefetching, tokenList])

  const addCustomToken = useCallback(() => {
    push('/tokenManagement/addCustomToken')
  }, [push])

  const renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={addCustomToken}
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <Icons.Content.Add
          testID="add_custon_network_btn"
          width={25}
          height={25}
          color={colors.$textPrimary}
        />
      </TouchableOpacity>
    )
  }, [addCustomToken, colors.$textPrimary])

  const renderHeader = useCallback(() => {
    return <SearchBar onTextChanged={handleSearch} searchText={searchText} />
  }, [handleSearch, searchText])

  return (
    <FlatListScreenTemplate
      title="Manage list"
      data={tokenList}
      renderHeaderRight={renderHeaderRight}
      ItemSeparatorComponent={renderSeparator}
      renderItem={item =>
        renderItem(item as ListRenderItemInfo<LocalTokenWithBalance>)
      }
      onRefresh={refetch}
      refreshing={false}
      ListEmptyComponent={ListEmptyComponent}
      keyExtractor={item => (item as LocalTokenWithBalance).localId}
      renderHeader={renderHeader}
    />
  )
}

export default TokenManagementScreen
