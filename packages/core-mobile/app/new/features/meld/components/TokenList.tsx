import React, { useEffect, useMemo, useState } from 'react'
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
import { useSearchableERC20AndSolanaTokenList } from 'common/hooks/useSearchableERC20AndSolanaTokenList'
import { useSupportedCryptoCurrencies, useTokenIndex } from '../store'
import { CryptoCurrency, CryptoCurrencyWithBalance } from '../types'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'

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
  const { tokenIndex, splTokenIndex, setTokenIndex, setSplTokenIndex } =
    useTokenIndex()
  const {
    supportedErc20AndNativeCryptoCurrencies,
    supportedSplCryptoCurrencies,
    setSupportedCryptoCurrencies,
    setSupportedSplCryptoCurrencies
  } = useSupportedCryptoCurrencies()
  const { filteredErc20TokenList, filteredSolanaTokenList } =
    useSearchableERC20AndSolanaTokenList(
      category !== ServiceProviderCategories.CRYPTO_ONRAMP
    )

  useEffect(() => {
    if (filteredErc20TokenList.length > 0) {
      setTokenIndex(filteredErc20TokenList)
    }
    if (filteredSolanaTokenList.length > 0) {
      setSplTokenIndex(filteredSolanaTokenList)
    }
  }, [
    filteredErc20TokenList,
    setTokenIndex,
    setSplTokenIndex,
    filteredSolanaTokenList
  ])

  useEffect(() => {
    if (cryptoCurrencies && tokenIndex) {
      setSupportedCryptoCurrencies(cryptoCurrencies, tokenIndex)
    }
    if (cryptoCurrencies && splTokenIndex) {
      setSupportedSplCryptoCurrencies(cryptoCurrencies, splTokenIndex)
    }
  }, [
    cryptoCurrencies,
    tokenIndex,
    splTokenIndex,
    setSupportedCryptoCurrencies,
    setSupportedSplCryptoCurrencies
  ])

  const supportedCryptoCurrencies = useMemo(() => {
    return [
      ...supportedErc20AndNativeCryptoCurrencies,
      ...supportedSplCryptoCurrencies
    ]
  }, [supportedErc20AndNativeCryptoCurrencies, supportedSplCryptoCurrencies])

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
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ width: SCREEN_WIDTH * 0.65 }}>
                {name}
              </Text>
              <View sx={{ flexDirection: 'row' }}>
                <SubTextNumber
                  number={Number(item.tokenWithBalance.balanceDisplayValue)}
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
