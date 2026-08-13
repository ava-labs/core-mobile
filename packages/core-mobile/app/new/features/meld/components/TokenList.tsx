import React, { useCallback, useMemo, useState } from 'react'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import {
  Icons,
  Separator,
  Text,
  SCREEN_WIDTH,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CHAIN_IDS_WITH_INCORRECT_SYMBOL } from 'consts/chainIdsWithIncorrectSymbol'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { LocalTokenWithBalance } from 'store/balance'
import { useMeldOnrampTokenPool } from '../hooks/useMeldOnrampTokenPool'
import { CryptoCurrency, CryptoCurrencyWithBalance } from '../types'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { isTokenTradable } from '../utils'

export const TokenList = ({
  category,
  onPress,
  selectedToken,
  cryptoCurrencies,
  isLoadingCryptoCurrencies
}: {
  category: ServiceProviderCategories
  onPress: (token: CryptoCurrencyWithBalance) => void
  selectedToken?: CryptoCurrency
  cryptoCurrencies?: CryptoCurrency[]
  isLoadingCryptoCurrencies: boolean
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [searchText, setSearchText] = useState<string>('')
  const isOnramp = category === ServiceProviderCategories.CRYPTO_ONRAMP

  // Onramp ("Select other token"): paginated + keyword-searched v2 catalog
  // (scoped to C-Chain/Ethereum) unioned with every held token, see
  // useMeldOnrampTokenPool. Offramp/other: balance-only, held tokens only.
  const {
    tokens: onrampPool,
    isLoading: isLoadingOnrampPool,
    isFetchingNextPage: isFetchingNextOnrampPage,
    hasNextPage: hasNextOnrampPage,
    fetchNextPage: fetchNextOnrampPage
  } = useMeldOnrampTokenPool({ searchText, enabled: isOnramp })
  const { filteredTokenList: heldTokenList } = useSearchableTokenList({
    hideZeroBalance: true
  })

  const tokenPool: LocalTokenWithBalance[] = isOnramp
    ? onrampPool
    : heldTokenList

  const supportedCryptoCurrencies = useMemo((): CryptoCurrencyWithBalance[] => {
    if (!cryptoCurrencies) return []

    const result: CryptoCurrencyWithBalance[] = []
    for (const crypto of cryptoCurrencies) {
      const match = tokenPool.find(token => isTokenTradable(crypto, token))
      if (match) {
        result.push({ ...crypto, tokenWithBalance: match })
      }
    }
    return result
  }, [cryptoCurrencies, tokenPool])

  const searchResults = useMemo(() => {
    if (searchText.length === 0) {
      return supportedCryptoCurrencies ?? []
    }
    if (supportedCryptoCurrencies === undefined) {
      return []
    }

    return supportedCryptoCurrencies.filter(
      tk =>
        tk.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        tk.chainName?.toLowerCase().includes(searchText.toLowerCase()) ||
        tk.contractAddress?.toLowerCase().includes(searchText.toLowerCase()) ||
        tk.chainId?.toString().includes(searchText.toLowerCase()) ||
        tk.tokenWithBalance.symbol
          .toLowerCase()
          .includes(searchText.toLowerCase())
    )
  }, [searchText, supportedCryptoCurrencies])

  const sortedResults = useMemo(() => {
    const avaxC = searchResults.find(
      tk => tk.currencyCode === MELD_CURRENCY_CODES.AVAXC
    )
    const usdc = searchResults.find(
      tk => tk.currencyCode === MELD_CURRENCY_CODES.USDC_AVAXC
    )

    const others = searchResults.filter(
      token =>
        token.currencyCode !== MELD_CURRENCY_CODES.AVAXC &&
        token.currencyCode !== MELD_CURRENCY_CODES.USDC_AVAXC
    )

    const sortedOthers = others.toSorted((a, b) => {
      const balanceInCurrencyA = a.tokenWithBalance.balanceInCurrency ?? 0
      const balanceInCurrencyB = b.tokenWithBalance.balanceInCurrency ?? 0
      if (balanceInCurrencyA === balanceInCurrencyB) {
        return 0
      }
      return balanceInCurrencyA > balanceInCurrencyB ? -1 : 1
    })
    return [...(avaxC ? [avaxC] : []), ...(usdc ? [usdc] : []), ...sortedOthers]
  }, [searchResults])

  const handleEndReached = useCallback(() => {
    if (hasNextOnrampPage && !isFetchingNextOnrampPage) {
      fetchNextOnrampPage()
    }
  }, [hasNextOnrampPage, isFetchingNextOnrampPage, fetchNextOnrampPage])

  const renderItem: ListRenderItem<CryptoCurrencyWithBalance> = ({
    item,
    index
  }): React.JSX.Element => {
    const name = CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(Number(item.chainId))
      ? item.chainName
      : item.name
    const isSelected = selectedToken?.currencyCode === item.currencyCode
    const isLastItem =
      supportedCryptoCurrencies &&
      index === supportedCryptoCurrencies.length - 1

    return (
      <TouchableOpacity
        onPress={() => onPress(item)}
        sx={{
          marginTop: 10,
          paddingLeft: 16
        }}>
        <View
          sx={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 16
          }}>
          <View sx={{ flexDirection: 'row', gap: 10 }}>
            <LogoWithNetwork
              token={item.tokenWithBalance}
              outerBorderColor={colors.$surfaceSecondary}
            />
            <View>
              <Text
                testID={`token_selector__${item.tokenWithBalance.symbol}`}
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ width: SCREEN_WIDTH * 0.65 }}>
                {name}
              </Text>
              <View sx={{ flexDirection: 'row' }}>
                <SubTextNumber
                  number={item.tokenWithBalance.balanceDisplayValue}
                  textColor={colors.$textPrimary}
                  textVariant="subtitle2"
                />
                <Text
                  variant="subtitle2"
                  sx={{
                    color: colors.$textPrimary
                  }}>
                  {' ' + item.tokenWithBalance.symbol}
                </Text>
              </View>
            </View>
          </View>
          {isSelected && (
            <Icons.Custom.CheckSmall color={colors.$textPrimary} />
          )}
        </View>
        {!isLastItem && (
          <Separator
            sx={{
              marginTop: 10,
              marginLeft: 46,
              width: '100%'
            }}
          />
        )}
      </TouchableOpacity>
    )
  }

  if (isLoadingCryptoCurrencies || (isOnramp && isLoadingOnrampPool)) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <SelectTokenScreen
      onSearchText={setSearchText}
      searchText={searchText}
      tokens={sortedResults}
      renderListItem={renderItem}
      keyExtractor={item => `${item.currencyCode}`}
      onEndReached={isOnramp ? handleEndReached : undefined}
      isFetchingNextPage={isOnramp && isFetchingNextOnrampPage}
    />
  )
}
