import React, { RefObject, useEffect, useRef } from 'react'
import {
  InteractionManager,
  ListRenderItemInfo,
  TextInput,
  View
} from 'react-native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import Loader from 'components/Loader'
import ZeroState from 'components/ZeroState'
import PortfolioListItem from 'components/PortfolioListItem'
import { Space } from 'components/Space'
import SearchBar from 'components/SearchBar'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { LocalTokenWithBalance } from 'store/balance/types'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { isTokenMalicious } from 'utils/isTokenMalicious'

const DEFAULT_HORIZONTAL_MARGIN = 16

interface TokenSelectorProps {
  onTokenSelected: (token: TokenWithBalance) => void
  hideZeroBalance?: boolean
  horizontalMargin?: number
  testID?: string
}

function TokenSelector({
  onTokenSelected,
  hideZeroBalance = false,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN
}: TokenSelectorProps): React.JSX.Element {
  const { filteredTokenList, searchText, setSearchText } =
    useSearchableTokenList(hideZeroBalance, true)
  const textInputRef = useRef() as RefObject<TextInput>

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        textInputRef.current?.focus()
      }, 300) //delay is for some weird bug effect when opening select token on swap page
    })
  }, [textInputRef])

  const renderItem = (
    item: ListRenderItemInfo<TokenWithBalance>
  ): React.JSX.Element => {
    const token = item.item
    return (
      <PortfolioListItem
        isMalicious={isTokenMalicious(token)}
        testID={`token_selector__${token.symbol}`}
        tokenName={token.name}
        tokenPrice={token.balanceDisplayValue ?? '0'}
        tokenPriceInCurrency={token.balanceInCurrency}
        image={token?.logoUri}
        symbol={token.symbol}
        onPress={() => {
          onTokenSelected(token)
        }}
      />
    )
  }

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  function getNoResultsText(): string | undefined {
    if (
      !filteredTokenList ||
      (filteredTokenList &&
        filteredTokenList?.length === 0 &&
        (!searchText || (searchText && searchText.length === 0)))
    ) {
      return 'You have no tokens to send'
    }
    return undefined
  }

  return (
    <View style={{ flex: 1, marginHorizontal: horizontalMargin }}>
      <SearchBar
        testID="search_bar__select_token"
        onTextChanged={handleSearch}
        searchText={searchText}
      />
      <Space y={16} />
      {!filteredTokenList ? (
        <Loader />
      ) : (
        <BottomSheetFlatList
          testID="token_selector_list"
          keyboardShouldPersistTaps="handled"
          data={filteredTokenList}
          renderItem={renderItem}
          refreshing={false}
          keyExtractor={(item: LocalTokenWithBalance) => item.localId}
          ListEmptyComponent={
            <ZeroState.NoResultsTextual message={getNoResultsText()} />
          }
        />
      )}
    </View>
  )
}

export default TokenSelector
