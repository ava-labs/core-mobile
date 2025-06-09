import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo, useState } from 'react'
import {
  Button,
  View,
  Text,
  Icons,
  Pressable,
  useTheme,
  FiatAmountInputWidget
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import {
  PaymentMethods,
  SearchProviderCategories,
  SearchProviders
} from 'services/meld/consts'
import { useOnRampToken } from '../store'
import {
  isBtcToken,
  isSupportedErc20Token,
  isSupportedNativeToken
} from '../utils'
import { useGetPurchaseLimits } from '../hooks/useGetPurchaseLimits'
import { useSearchServiceProviders } from '../hooks/useSearchServiceProviders'
import { useSearchDefaultsByCountry } from '../hooks/useSearchDefaultsByCountry'
import { useLocale } from '../hooks/useLocale'

export const SelectBuyAmountScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { formatIntegerCurrency, formatCurrency } = useFormatCurrency()
  const { getFromPopulatedNetwork } = useNetworks()
  const [amount, setAmount] = useState<number>()
  const { navigate } = useRouter()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { getMarketTokenBySymbol } = useWatchlist()
  const [onrampToken] = useOnRampToken()
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })
  const { data: serviceProviders } = useSearchServiceProviders({
    categories: [SearchProviderCategories.CryptoOnramp]
  })
  const { data: purchaseLimits } = useGetPurchaseLimits({
    serviceProviders: serviceProviders?.map(
      serviceProvider => serviceProvider.serviceProvider
    ),
    categories: [SearchProviderCategories.CryptoOnramp],
    fiatCurrencies: [selectedCurrency],
    cryptoCurrencyCodes: onrampToken?.currencyCode
      ? [onrampToken?.currencyCode]
      : undefined
  })
  const { countryCode } = useLocale()

  const { data: defaultsByCountry } = useSearchDefaultsByCountry({
    categories: [SearchProviderCategories.CryptoOnramp]
  })

  const defaultPaymentMethod = useMemo(() => {
    const pm = defaultsByCountry?.find(d => d.countryCode === countryCode)
      ?.defaultPaymentMethods[0]
    return pm ? PaymentMethods[pm as keyof typeof PaymentMethods] : undefined
  }, [defaultsByCountry, countryCode])

  const isWithinPurchaseLimit = useMemo(() => {
    const purchasingFiatCurrency = purchaseLimits?.find(
      limit => limit.currencyCode === selectedCurrency
    )

    if (!purchasingFiatCurrency) {
      // if there is no matching fiat currency found, we don't allow the user to proceed
      return false
    }

    return (
      (amount ?? 0) <= (purchasingFiatCurrency?.maximumAmount ?? 0) &&
      (amount ?? 0) >= (purchasingFiatCurrency?.minimumAmount ?? 0)
    )
  }, [purchaseLimits, amount, selectedCurrency])

  const isBuyAllowed = useMemo(() => {
    return (amount ?? 0) > 0 && isWithinPurchaseLimit
  }, [amount, isWithinPurchaseLimit])

  const token = useMemo(() => {
    const t = filteredTokenList.find(
      tk =>
        onrampToken &&
        (isSupportedNativeToken(onrampToken, tk) ||
          isSupportedErc20Token(onrampToken, tk) ||
          isBtcToken(onrampToken, tk))
    )
    if (t) {
      return {
        ...onrampToken,
        tokenWithBalance: t
      }
    }
  }, [filteredTokenList, onrampToken])

  const network = useMemo(
    () => getFromPopulatedNetwork(token?.tokenWithBalance?.networkChainId),
    [getFromPopulatedNetwork, token?.tokenWithBalance?.networkChainId]
  )

  const tokenBalance = useMemo(() => {
    if (token?.tokenWithBalance === undefined) {
      return undefined
    }

    return new TokenUnit(
      token?.tokenWithBalance?.balance ?? 0,
      token?.tokenWithBalance && 'decimals' in token.tokenWithBalance
        ? token.tokenWithBalance.decimals
        : network?.networkToken.decimals ?? 0,
      token?.tokenWithBalance?.symbol ?? ''
    )
  }, [network?.networkToken.decimals, token?.tokenWithBalance])

  const formatInTokenUnit = useCallback(
    (amt: number): string => {
      if (token?.tokenWithBalance === undefined || amt === 0) {
        return ''
      }
      const currentPrice =
        getMarketTokenBySymbol(token.tokenWithBalance.symbol)?.currentPrice ?? 0
      const maxDecimals =
        token.tokenWithBalance && 'decimals' in token.tokenWithBalance
          ? token.tokenWithBalance.decimals
          : 0

      const tokenAmount = (amt / currentPrice) * 10 ** maxDecimals
      const tokenUnit = new TokenUnit(
        tokenAmount,
        maxDecimals,
        token.tokenWithBalance.symbol
      )
      return tokenUnit.toDisplay() + ' ' + token.tokenWithBalance.symbol
    },
    [getMarketTokenBySymbol, token?.tokenWithBalance]
  )

  const handleSelectToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectBuyToken')
  }, [navigate])

  const onNext = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectPaymentMethod')
  }, [navigate])

  const renderFooter = useCallback(() => {
    return (
      <View
        style={{
          gap: 20
        }}>
        <Button
          disabled={!isBuyAllowed}
          type="primary"
          size="large"
          onPress={onNext}>
          Next
        </Button>
      </View>
    )
  }, [onNext, isBuyAllowed])

  return (
    <ScrollScreen
      bottomOffset={150}
      isModal
      title={`${'How much do\nyou like to buy?'}`}
      navigationTitle="Enter buy amount"
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      contentContainerStyle={{
        padding: 16
      }}>
      {/* Select Token */}
      <Pressable
        onPress={handleSelectToken}
        sx={{
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 12,
          justifyContent: 'space-between',
          padding: 17,
          backgroundColor: colors.$surfaceSecondary
        }}>
        <Text
          variant="body1"
          sx={{ fontSize: 16, lineHeight: 22, color: colors.$textPrimary }}>
          Token
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {token?.tokenWithBalance && (
            <>
              <LogoWithNetwork
                token={token.tokenWithBalance}
                outerBorderColor={colors.$surfaceSecondary}
              />
              <Text
                variant="body1"
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.$textSecondary
                }}>
                {token?.tokenWithBalance?.symbol}
              </Text>
            </>
          )}
          <View sx={{ marginLeft: 8 }}>
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
          </View>
        </View>
      </Pressable>

      {/* Fiat amount input widget */}
      {token?.tokenWithBalance && tokenBalance && (
        <FiatAmountInputWidget
          sx={{ marginTop: 12 }}
          currency={selectedCurrency}
          amount={amount}
          onChange={setAmount}
          formatIntegerCurrency={amt =>
            formatIntegerCurrency({ amount: amt, withoutCurrencySuffix: true })
          }
          formatInCurrency={amt => formatCurrency({ amount: amt })}
          formatInTokenUnit={formatInTokenUnit}
        />
      )}

      {/* Pay with */}
      {defaultsByCountry && defaultsByCountry?.length > 0 && (
        <Pressable
          // onPress={handleSelectPaymentMethod}
          sx={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            justifyContent: 'space-between',
            padding: 17,
            backgroundColor: colors.$surfaceSecondary
          }}>
          <Text
            variant="body1"
            sx={{
              fontSize: 16,
              lineHeight: 22,
              fontWeight: 400,
              color: colors.$textPrimary
            }}>
            Pay with
          </Text>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View>
              <Text
                variant="body2"
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  fontWeight: 400,
                  textAlign: 'right'
                }}>
                {defaultPaymentMethod}
              </Text>
              {/* Todo: CP-10736 */}
              <Text
                variant="caption"
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  textAlign: 'right'
                }}>
                {
                  SearchProviders[
                    serviceProviders?.[0]
                      ?.serviceProvider as keyof typeof SearchProviders
                  ]
                }
              </Text>
            </View>
            <View sx={{ marginLeft: 8 }}>
              <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
            </View>
          </View>
        </Pressable>
      )}
    </ScrollScreen>
  )
}
