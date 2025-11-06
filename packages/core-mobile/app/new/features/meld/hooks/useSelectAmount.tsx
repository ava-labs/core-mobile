import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { View, Text, useTheme, alpha } from '@avalabs/k2-alpine'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { getAddressByNetwork } from 'store/account/utils'
import { selectActiveAccount } from 'store/account'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useNavigation } from '@react-navigation/native'
import { ACTIONS } from 'contexts/DeeplinkContext/types'
import { useDebouncedCallback } from 'use-debounce'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import Logger from 'utils/Logger'
import { humanize } from 'utils/string/humanize'
import {
  PaymentMethodNames,
  ServiceProviderCategories,
  ServiceProviderNames
} from '../consts'
import {
  useMeldCountryCode,
  useMeldPaymentMethod,
  useMeldServiceProvider
} from '../store'
import {
  CreateCryptoQuoteErrorCode,
  CreateSessionWidget,
  CryptoCurrency,
  SessionTypes
} from '../types'
import { useSearchDefaultsByCountry } from './useSearchDefaultsByCountry'
import { useCreateSessionWidget } from './useCreateSessionWidget'
import { useServiceProviders } from './useServiceProviders'
import { useFiatSourceAmount } from './useFiatSourceAmount'
import { useMeldTokenWithBalance } from './useMeldTokenWithBalance'

const DEFAULT_DEBOUNCE_MILLISECONDS = 300

export const useSelectAmount = ({
  category
}: {
  category: ServiceProviderCategories
}): {
  isLoadingDefaultsByCountry: boolean
  isLoadingTradeLimits: boolean
  isLoadingCryptoQuotes: boolean
  paymentMethodToDisplay: string | undefined
  serviceProviderToDisplay: string | undefined
  token?: CryptoCurrency & { tokenWithBalance: LocalTokenWithBalance }
  tokenBalance: TokenUnit | undefined
  hasValidSourceAmount: boolean
  isEnabled: boolean
  formatInSubTextNumber: (amt: number | undefined | null) => JSX.Element
  setSourceAmount: (amt: number) => void
  sourceAmount: number | undefined
  createSessionWidget: () => Promise<CreateSessionWidget | undefined>
  errorMessage?: string
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const {
    theme: { colors }
  } = useTheme()
  const account = useSelector(selectActiveAccount)
  const { getState } = useNavigation()
  const { formatCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [serviceProvider, setServiceProvider] = useMeldServiceProvider()
  const [paymentMethod, setPaymentMethod] = useMeldPaymentMethod()
  const {
    sourceAmount,
    setSourceAmount,
    isAboveMinimumLimit,
    isBelowMaximumLimit,
    hasValidSourceAmount,
    minimumLimit,
    maximumLimit,
    isLoadingTradeLimits
  } = useFiatSourceAmount({ category })
  const [countryCode] = useMeldCountryCode()

  const { getFromPopulatedNetwork } = useNetworks()

  // debounce since fetching quotes can take awhile
  const debouncedSetAmount = useDebouncedCallback(
    setSourceAmount,
    DEFAULT_DEBOUNCE_MILLISECONDS
  )

  const { data: defaultsByCountry, isLoading: isLoadingDefaultsByCountry } =
    useSearchDefaultsByCountry({
      categories: [category]
    })

  const token = useMeldTokenWithBalance({ category })

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

  const currentPrice =
    useMarketTokenBySymbol({
      symbol: token?.tokenWithBalance.symbol
    })?.currentPrice ?? 0

  const getSourceAmountInTokenUnit = useCallback(
    (amt: number | undefined | null): TokenUnit => {
      const maxDecimals =
        token?.tokenWithBalance && 'decimals' in token.tokenWithBalance
          ? token.tokenWithBalance.decimals
          : 0

      const tokenAmount =
        amt !== null && amt !== undefined && currentPrice !== 0
          ? (amt / currentPrice) * 10 ** maxDecimals
          : 0

      return new TokenUnit(
        tokenAmount,
        maxDecimals,
        token?.tokenWithBalance.symbol ?? ''
      )
    },
    [token?.tokenWithBalance, currentPrice]
  )

  const hasEnoughBalance = useMemo(() => {
    return (
      tokenBalance !== undefined &&
      sourceAmount !== undefined &&
      getSourceAmountInTokenUnit(sourceAmount).lt(tokenBalance)
    )
  }, [getSourceAmountInTokenUnit, sourceAmount, tokenBalance])

  const enabled = useMemo(() => {
    if (category === ServiceProviderCategories.CRYPTO_ONRAMP) {
      return hasValidSourceAmount
    }
    return hasValidSourceAmount && hasEnoughBalance
  }, [category, hasValidSourceAmount, hasEnoughBalance])

  const { crytoQuotes, isLoadingCryptoQuotes, cryptoQuotesError } =
    useServiceProviders({
      category,
      paymentMethodType: paymentMethod,
      enabled
    })

  useEffect(() => {
    setPaymentMethod(undefined)
    setServiceProvider(undefined)
  }, [setPaymentMethod, setServiceProvider, token?.currencyCode])

  const walletAddress = useMemo(() => {
    return account && network && getAddressByNetwork(account, network)
  }, [account, network])

  const redirectUrl = useMemo(() => {
    const state = getState()
    const currentIndex = state?.index
    return `core://${
      category === ServiceProviderCategories.CRYPTO_ONRAMP
        ? ACTIONS.OnrampCompleted
        : ACTIONS.OfframpCompleted
    }?dismissCount=${(currentIndex ?? 0) + 1}`
  }, [getState, category])

  const destinationCurrencyCode = useMemo(() => {
    return category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? token?.currencyCode ?? ''
      : selectedCurrency
  }, [category, token?.currencyCode, selectedCurrency])

  const sourceCurrencyCode = useMemo(() => {
    return category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? selectedCurrency
      : token?.currencyCode ?? ''
  }, [category, token?.currencyCode, selectedCurrency])

  const { createSessionWidget } = useCreateSessionWidget({
    category,
    sessionType:
      category === ServiceProviderCategories.CRYPTO_ONRAMP
        ? SessionTypes.BUY
        : SessionTypes.SELL,
    sessionData: {
      redirectUrl,
      redirectFlow:
        category === ServiceProviderCategories.CRYPTO_OFFRAMP
          ? true
          : undefined,
      destinationCurrencyCode,
      sourceCurrencyCode,
      walletAddress,
      serviceProvider
    }
  })

  const isEnabled = useMemo(() => {
    return (
      hasValidSourceAmount &&
      isLoadingCryptoQuotes === false &&
      cryptoQuotesError === undefined &&
      serviceProvider !== undefined &&
      paymentMethod !== undefined
    )
  }, [
    hasValidSourceAmount,
    isLoadingCryptoQuotes,
    cryptoQuotesError,
    serviceProvider,
    paymentMethod
  ])

  const defaultPaymentMethod = useMemo(() => {
    if (category === ServiceProviderCategories.CRYPTO_ONRAMP) {
      return defaultsByCountry?.find(d => d.countryCode === countryCode)
        ?.defaultPaymentMethods?.[0]
    }

    if (category === ServiceProviderCategories.CRYPTO_OFFRAMP) {
      return crytoQuotes[0]?.paymentMethodType
    }

    return undefined
  }, [category, countryCode, crytoQuotes, defaultsByCountry])

  const paymentMethodToDisplay = useMemo(() => {
    if (paymentMethod && PaymentMethodNames[paymentMethod]) {
      return PaymentMethodNames[paymentMethod]
    }
    return paymentMethod ? humanize(paymentMethod) : undefined
  }, [paymentMethod])

  const serviceProviderToDisplay = useMemo(() => {
    if (serviceProvider && ServiceProviderNames[serviceProvider]) {
      return ServiceProviderNames[serviceProvider]
    }
    return serviceProvider ? humanize(serviceProvider) : undefined
  }, [serviceProvider])

  useLayoutEffect(() => {
    setPaymentMethod(undefined)
    setServiceProvider(undefined)
    setSourceAmount(0)
  }, [setPaymentMethod, setServiceProvider, setSourceAmount])

  useEffect(() => {
    if (paymentMethod === undefined && defaultPaymentMethod) {
      setPaymentMethod(defaultPaymentMethod)
    }
    if (serviceProvider === undefined && crytoQuotes[0]?.serviceProvider) {
      setServiceProvider(crytoQuotes[0].serviceProvider)
    }

    if (crytoQuotes.length === 0) {
      setServiceProvider(undefined)
    }
  }, [
    crytoQuotes,
    defaultPaymentMethod,
    paymentMethod,
    serviceProvider,
    setPaymentMethod,
    setServiceProvider
  ])

  const minMaxErrorMessage = useMemo(
    () =>
      (cryptoQuotesError?.statusCode ===
        CreateCryptoQuoteErrorCode.NO_RESOURCE_FOUND &&
        cryptoQuotesError.message?.toLowerCase().includes('not found')) ||
      (cryptoQuotesError?.statusCode ===
        CreateCryptoQuoteErrorCode.INCOMPATIBLE_REQUEST &&
        cryptoQuotesError?.message
          ?.toLowerCase()
          .includes('not within the payment method limits')) ||
      cryptoQuotesError?.message?.toLowerCase().includes('crypto_min_limit') ||
      cryptoQuotesError?.message?.toLowerCase().includes('crypto_max_limit'),
    [cryptoQuotesError]
  )

  useEffect(() => {
    if (cryptoQuotesError === undefined) return

    if (minMaxErrorMessage) {
      Logger.error(
        `The selected amount is not within the minimum and maximum limits for ${category}:`,
        cryptoQuotesError
      )
      return
    }
    Logger.error(`failed to fetch quotes for ${category}:`, cryptoQuotesError)
  }, [minMaxErrorMessage, category, cryptoQuotesError])

  const errorMessage = useMemo(() => {
    if (
      category === ServiceProviderCategories.CRYPTO_OFFRAMP &&
      hasEnoughBalance === false
    ) {
      return `You don't have enough ${token?.tokenWithBalance.symbol} to withdraw`
    }

    if (isAboveMinimumLimit === false && minimumLimit && sourceAmount !== 0) {
      const formattedMinimumLimit = formatCurrency({
        amount: minimumLimit
      })
      return category === ServiceProviderCategories.CRYPTO_ONRAMP
        ? `The minimum purchase amount is ${formattedMinimumLimit} ${selectedCurrency}`
        : `The minimum withdrawal token amount is ${formattedMinimumLimit} ${selectedCurrency}`
    }

    if (isBelowMaximumLimit === false && maximumLimit && sourceAmount !== 0) {
      const formattedMaximumLimit = formatCurrency({
        amount: maximumLimit
      })
      return category === ServiceProviderCategories.CRYPTO_ONRAMP
        ? `The maximum purchase amount is ${formattedMaximumLimit} ${selectedCurrency}`
        : `The maximum withdrawal token amount is ${formattedMaximumLimit} ${selectedCurrency}`
    }

    if (minMaxErrorMessage) {
      return 'Transaction amount is invalid: it must be between the minimum and maximum allowed.'
    }

    if (cryptoQuotesError?.statusCode) {
      return (
        cryptoQuotesError.message ??
        'We are unable to fetch the quotes, please check your input. Adjust the country, currency, token, or amount and try again.'
      )
    }

    return undefined
  }, [
    category,
    hasEnoughBalance,
    isAboveMinimumLimit,
    minimumLimit,
    sourceAmount,
    isBelowMaximumLimit,
    maximumLimit,
    minMaxErrorMessage,
    cryptoQuotesError,
    token?.tokenWithBalance.symbol,
    formatCurrency,
    selectedCurrency
  ])

  const formatInSubTextNumber = useCallback(
    (amt: number | undefined | null): JSX.Element => {
      const sourceAmountInTokenUnit = getSourceAmountInTokenUnit(amt)
      return (
        <View
          sx={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 0,
            color:
              errorMessage === undefined
                ? alpha(colors.$textPrimary, 0.9)
                : colors.$textDanger
          }}>
          <SubTextNumber
            number={Number(
              sourceAmountInTokenUnit.toDisplay({ asNumber: true })
            )}
            textColor={colors.$textPrimary}
            textVariant="subtitle2"
          />
          <Text
            variant="subtitle2"
            sx={{
              color: colors.$textPrimary
            }}>
            {' ' + token?.tokenWithBalance.symbol}
          </Text>
        </View>
      )
    },
    [
      getSourceAmountInTokenUnit,
      errorMessage,
      colors.$textPrimary,
      colors.$textDanger,
      token?.tokenWithBalance.symbol
    ]
  )

  return {
    formatInSubTextNumber,
    sourceAmount,
    setSourceAmount: debouncedSetAmount,
    paymentMethodToDisplay,
    serviceProviderToDisplay,
    isEnabled,
    token,
    tokenBalance,
    hasValidSourceAmount,
    isLoadingDefaultsByCountry,
    isLoadingTradeLimits,
    createSessionWidget,
    isLoadingCryptoQuotes,
    errorMessage
  }
}
