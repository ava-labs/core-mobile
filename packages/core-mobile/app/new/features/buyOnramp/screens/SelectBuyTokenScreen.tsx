import React, { useMemo, useState } from 'react'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import {
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { LocalTokenWithBalance } from 'store/balance'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import {
  MELD_CURRENCY_CODES,
  SearchProviderCategories
} from 'services/meld/consts'
import { CHAIN_IDS_WITH_INCORRECT_SYMBOL } from 'consts/chainIdsWithIncorrectSymbol'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { useOnRampToken } from '../store'
import {
  CryptoCurrency,
  useSearchCryptoCurrencies
} from '../hooks/useSearchCryptoCurrencies'
import { useSearchServiceProviders } from '../hooks/useSearchServiceProviders'
import {
  isBtcToken,
  isSupportedErc20Token,
  isSupportedNativeToken
} from '../utils'

type CryptoCurrencyWithBalance = CryptoCurrency & {
  tokenWithBalance: LocalTokenWithBalance
}

export const SelectBuyTokenScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [searchText, setSearchText] = useState<string>('')
  const [selectedToken, setSelectedToken] = useOnRampToken()
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })
  const { data: serviceProviders, isLoading: isLoadingServiceProviders } =
    useSearchServiceProviders({
      categories: [SearchProviderCategories.CryptoOnramp]
    })
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [SearchProviderCategories.CryptoOnramp],
      serviceProviders: serviceProviders?.map(
        serviceProvider => serviceProvider.serviceProvider
      )
    })

  const handleSelectToken = (token: CryptoCurrency): void => {
    setSelectedToken(token)
    // @ts-ignore TODO: make routes typesafe
    // navigate('./inputAmount')
  }

  const supportedCryptoCurrencies = useMemo(() => {
    return cryptoCurrencies?.reduce((acc, crypto) => {
      const token = filteredTokenList.find(
        tk =>
          isSupportedNativeToken(crypto, tk) ||
          isSupportedErc20Token(crypto, tk) ||
          isBtcToken(crypto, tk)
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
        tk.name.toLowerCase().includes(searchText.toLowerCase()) ||
        tk.chainName.toLowerCase().includes(searchText.toLowerCase()) ||
        tk.contractAddress?.toLowerCase().includes(searchText.toLowerCase()) ||
        tk.chainId?.toString().includes(searchText.toLowerCase())
    )
  }, [searchText, supportedCryptoCurrencies])

  const sortedResults = useMemo(() => {
    const avalancheCChain = searchResults.find(
      tk => tk.currencyCode === MELD_CURRENCY_CODES.AVAXC
    )
    const usdc = searchResults.find(
      tk => tk.currencyCode === MELD_CURRENCY_CODES.USDC
    )

    const others = searchResults.filter(
      token =>
        token.currencyCode !== MELD_CURRENCY_CODES.AVAXC &&
        token.currencyCode !== MELD_CURRENCY_CODES.USDC
    )

    const sortedOthers = others.toSorted((a, b) => {
      const balanceInCurrencyA = a.tokenWithBalance.balanceInCurrency ?? 0
      const balanceInCurrencyB = b.tokenWithBalance.balanceInCurrency ?? 0
      if (balanceInCurrencyA === balanceInCurrencyB) {
        return 0
      }
      return balanceInCurrencyA > balanceInCurrencyB ? -1 : 1
    })
    return [
      ...(avalancheCChain ? [avalancheCChain] : []),
      ...(usdc ? [usdc] : []),
      ...sortedOthers
    ]
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
        onPress={() => handleSelectToken(item)}
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
              <Text variant="buttonMedium">{name}</Text>
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

  if (isLoadingCryptoCurrencies || isLoadingServiceProviders) {
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
