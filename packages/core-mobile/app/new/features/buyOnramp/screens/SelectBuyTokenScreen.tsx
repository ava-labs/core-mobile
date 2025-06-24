import React, { useMemo, useState } from 'react'
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
import { LocalTokenWithBalance } from 'store/balance'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { CHAIN_IDS_WITH_INCORRECT_SYMBOL } from 'consts/chainIdsWithIncorrectSymbol'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { useRouter } from 'expo-router'
import { useOnRampToken } from '../store'
import { useSearchCryptoCurrencies } from '../hooks/useSearchCryptoCurrencies'
import { isTokenSupportedForBuying } from '../utils'
import { CryptoCurrency } from '../types'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { useBuy } from '../hooks/useBuy'

type CryptoCurrencyWithBalance = CryptoCurrency & {
  tokenWithBalance: LocalTokenWithBalance
}

export const SelectBuyTokenScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { canGoBack, back } = useRouter()
  const { navigateToBuy } = useBuy()
  const [searchText, setSearchText] = useState<string>('')
  const [selectedToken] = useOnRampToken()
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })

  const supportedCryptoCurrencies = useMemo(() => {
    return cryptoCurrencies?.reduce((acc, crypto) => {
      const token = filteredTokenList.find(tk =>
        isTokenSupportedForBuying(crypto, tk)
      )
      if (token) {
        acc.push({
          ...crypto,
          tokenWithBalance: token
        })
      }
      return acc
    }, [] as CryptoCurrencyWithBalance[])
  }, [cryptoCurrencies, filteredTokenList])

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
        onPress={() => {
          canGoBack() && back()
          navigateToBuy({ token: item.tokenWithBalance })
        }}
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
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ width: SCREEN_WIDTH * 0.65 }}>
                {name}
              </Text>
              <Text variant="subtitle2">
                {item.tokenWithBalance.balanceDisplayValue +
                  ' ' +
                  item.tokenWithBalance.symbol}
              </Text>
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

  if (isLoadingCryptoCurrencies) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <SelectTokenScreen
      onSearchText={setSearchText}
      searchText={searchText}
      tokens={sortedResults}
      renderListItem={renderItem}
      keyExtractor={item => `${item.currencyCode}`}
    />
  )
}
