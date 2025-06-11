import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo, useEffect, useLayoutEffect } from 'react'
import {
  Button,
  View,
  Text,
  Icons,
  Pressable,
  useTheme,
  FiatAmountInputWidget,
  ActivityIndicator
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
  ServiceProviderCategories,
  ServiceProviders,
  SessionTypes
} from 'services/meld/consts'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import {
  useOnRampPaymentMethod,
  useOnRampServiceProvider,
  useOnRampSourceAmount,
  useOnRampToken
} from '../store'
import {
  isBtcToken,
  isSupportedErc20Token,
  isSupportedNativeToken
} from '../utils'
import { useGetPurchaseLimits } from '../hooks/useGetPurchaseLimits'
import { useSearchDefaultsByCountry } from '../hooks/useSearchDefaultsByCountry'
import { useLocale } from '../hooks/useLocale'
import { useCreateCryptoWidget } from '../hooks/useCreateCryptoWidget'

export const SelectBuyAmountScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { openUrl } = useInAppBrowser()
  const { formatIntegerCurrency, formatCurrency } = useFormatCurrency()
  const { getFromPopulatedNetwork } = useNetworks()
  const { navigate } = useRouter()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { getMarketTokenBySymbol } = useWatchlist()
  const [onrampToken] = useOnRampToken()
  const [onRampPaymentMethod, setOnRampPaymentMethod] = useOnRampPaymentMethod()
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })
  const account = useSelector(selectActiveAccount)
  const [onRampServiceProvider, setOnRampServiceProvider] =
    useOnRampServiceProvider()
  const [sourceAmount, setSourceAmount] = useOnRampSourceAmount()
  const { data: purchaseLimits } = useGetPurchaseLimits({
    categories: [ServiceProviderCategories.CryptoOnramp],
    fiatCurrencies: [selectedCurrency],
    cryptoCurrencyCodes: onrampToken?.currencyCode
      ? [onrampToken?.currencyCode]
      : undefined
  })
  const { countryCode } = useLocale()

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

  const walletAddress = useMemo(() => {
    return account && network && getAddressByNetwork(account, network)
  }, [account, network])

  const { data: onrampWidget } = useCreateCryptoWidget({
    sourceAmount: sourceAmount ?? 0,
    destinationCurrencyCode: onrampToken?.currencyCode ?? '',
    sourceCurrencyCode: selectedCurrency,
    sessionType: SessionTypes.BUY,
    walletAddress,
    serviceProvider: onRampServiceProvider
  })

  const { data: defaultsByCountry, isLoading: isLoadingDefaultsByCountry } =
    useSearchDefaultsByCountry({
      categories: [ServiceProviderCategories.CryptoOnramp]
    })

  const defaultPaymentMethod = useMemo(() => {
    return defaultsByCountry?.find(d => d.countryCode === countryCode)
      ?.defaultPaymentMethods[0] as keyof typeof PaymentMethods
  }, [countryCode, defaultsByCountry])

  useLayoutEffect(() => {
    setOnRampPaymentMethod(undefined)
    setOnRampServiceProvider(undefined)
    setSourceAmount(0)
  }, [setOnRampPaymentMethod, setOnRampServiceProvider, setSourceAmount])

  useEffect(() => {
    if (onRampPaymentMethod === undefined && defaultPaymentMethod) {
      setOnRampPaymentMethod(defaultPaymentMethod)
    }
  }, [defaultPaymentMethod, onRampPaymentMethod, setOnRampPaymentMethod])

  const paymentMethodToDisplay = useMemo(() => {
    return onRampPaymentMethod
      ? PaymentMethods[onRampPaymentMethod as keyof typeof PaymentMethods]
      : undefined
  }, [onRampPaymentMethod])

  const serviceProviderToDisplay = useMemo(() => {
    return onRampServiceProvider
      ? ServiceProviders[onRampServiceProvider]
      : undefined
  }, [onRampServiceProvider])

  const selectedPurchasingFiatCurrency = useMemo(() => {
    return purchaseLimits?.find(
      limit => limit.currencyCode === selectedCurrency
    )
  }, [purchaseLimits, selectedCurrency])

  const minimumPurchaseLimit = selectedPurchasingFiatCurrency?.minimumAmount
  const maximumPurchaseLimit = selectedPurchasingFiatCurrency?.maximumAmount

  const isAboveMinimumPurchaseLimit = useMemo(() => {
    if (!selectedPurchasingFiatCurrency) {
      // if there is no matching fiat currency found, we don't allow the user to proceed
      return false
    }

    return (
      (sourceAmount ?? 0) >=
      (selectedPurchasingFiatCurrency?.minimumAmount ?? 0)
    )
  }, [selectedPurchasingFiatCurrency, sourceAmount])

  const isBelowMaximumPurchaseLimit = useMemo(() => {
    if (!selectedPurchasingFiatCurrency) {
      // if there is no matching fiat currency found, we don't allow the user to proceed
      return false
    }

    return (
      (sourceAmount ?? 0) <=
      (selectedPurchasingFiatCurrency?.maximumAmount ?? 0)
    )
  }, [selectedPurchasingFiatCurrency, sourceAmount])

  const isWithinPurchaseLimit =
    isBelowMaximumPurchaseLimit && isAboveMinimumPurchaseLimit

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

  const handleSelectPaymentMethod = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectPaymentMethod')
  }, [navigate])

  const onNext = useCallback((): void => {
    // navigate({
    //   // @ts-ignore TODO: make routes typesafe
    //   pathname: '/selectPaymentMethod',
    //   params: { url: onrampWidget?.widgetUrl }
    // })
    onrampWidget?.widgetUrl && openUrl(onrampWidget.widgetUrl)
  }, [onrampWidget?.widgetUrl, openUrl])

  const isBuyAllowed = useMemo(() => {
    return (
      (sourceAmount ?? 0) > 0 &&
      isWithinPurchaseLimit &&
      onrampWidget?.widgetUrl !== undefined
    )
  }, [sourceAmount, isWithinPurchaseLimit, onrampWidget?.widgetUrl])

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

  const renderPayWith = useCallback(() => {
    if (!sourceAmount || isWithinPurchaseLimit === false) {
      return null
    }

    return (
      paymentMethodToDisplay && (
        <Pressable
          onPress={handleSelectPaymentMethod}
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
            {isLoadingDefaultsByCountry ? (
              <ActivityIndicator size="small" color={colors.$textPrimary} />
            ) : (
              <>
                <View sx={{ justifyContent: 'center' }}>
                  <Text
                    variant="body2"
                    sx={{
                      fontSize: 16,
                      lineHeight: 22,
                      fontWeight: 400,
                      textAlign: 'right'
                    }}>
                    {paymentMethodToDisplay}
                  </Text>
                  {serviceProviderToDisplay && (
                    <Text
                      variant="caption"
                      sx={{
                        fontSize: 11,
                        fontWeight: 500,
                        textAlign: 'right'
                      }}>
                      {serviceProviderToDisplay}
                    </Text>
                  )}
                </View>
                <View sx={{ marginLeft: 8 }}>
                  <Icons.Navigation.ChevronRightV2
                    color={colors.$textPrimary}
                  />
                </View>
              </>
            )}
          </View>
        </Pressable>
      )
    )
  }, [
    sourceAmount,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    handleSelectPaymentMethod,
    isLoadingDefaultsByCountry,
    isWithinPurchaseLimit,
    paymentMethodToDisplay,
    serviceProviderToDisplay
  ])

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
          autoFocus
          isAmountValid={isWithinPurchaseLimit}
          sx={{ marginTop: 12 }}
          currency={selectedCurrency}
          amount={sourceAmount}
          onChange={setSourceAmount}
          formatIntegerCurrency={amt =>
            formatIntegerCurrency({ amount: amt, withoutCurrencySuffix: true })
          }
          formatInCurrency={amt => formatCurrency({ amount: amt })}
          formatInTokenUnit={formatInTokenUnit}
        />
      )}
      <View sx={{ alignItems: 'center', marginTop: 12 }}>
        {isAboveMinimumPurchaseLimit === false &&
          minimumPurchaseLimit &&
          sourceAmount !== 0 && (
            <Text
              variant="caption"
              sx={{
                fontWeight: 500,
                color: colors.$textDanger
              }}>{`The minimum purchase amount is ${minimumPurchaseLimit} ${selectedCurrency}`}</Text>
          )}
        {isBelowMaximumPurchaseLimit === false &&
          maximumPurchaseLimit &&
          sourceAmount !== 0 && (
            <Text
              variant="caption"
              sx={{
                fontWeight: 500,
                color: colors.$textDanger
              }}>{`The maximum purchase amount is ${maximumPurchaseLimit} ${selectedCurrency}`}</Text>
          )}
      </View>
      {/* Pay with */}
      {renderPayWith()}
    </ScrollScreen>
  )
}
