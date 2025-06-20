import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LocalTokenWithBalance } from 'store/balance'
import { getAddressByNetwork } from 'store/account/utils'
import { selectActiveAccount } from 'store/account'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useNavigation } from '@react-navigation/native'
import { ACTIONS } from 'contexts/DeeplinkContext/types'
import { useDebouncedCallback } from 'use-debounce'
import {
  PaymentMethodNames,
  ServiceProviderCategories,
  ServiceProviderNames
} from '../consts'
import {
  useOnRampPaymentMethod,
  useOnRampServiceProvider,
  useOnRampSourceAmount,
  useOnRampToken
} from '../store'
import {
  CreateCryptoQuoteErrorCode,
  CryptoCurrency,
  SessionTypes
} from '../types'
import { isTokenSupportedForBuying } from '../utils'
import { useGetPurchaseLimits } from './useGetPurchaseLimits'
import { useLocale } from './useLocale'
import { useSearchDefaultsByCountry } from './useSearchDefaultsByCountry'
import { useCreateSessionWidget } from './useCreateSessionWidget'
import { useServiceProviders } from './useServiceProviders'

const DEFAULT_DEBOUNCE_MILLISECONDS = 300

export const useSelectBuyAmount = (): {
  isLoadingDefaultsByCountry: boolean
  isLoadingPurchaseLimits: boolean
  isLoadingCryptoQuotes: boolean
  paymentMethodToDisplay: string | undefined
  serviceProviderToDisplay: string | undefined
  token?: CryptoCurrency & { tokenWithBalance: LocalTokenWithBalance }
  tokenBalance: TokenUnit | undefined
  isAboveMinimumPurchaseLimit: boolean
  isBelowMaximumPurchaseLimit: boolean
  isBuyAllowed: boolean
  formatInTokenUnit: (amt: number) => string
  setSourceAmount: (amt: number) => void
  sourceAmount: number | undefined
  widgetUrl?: string
  errorMessage?: string
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const account = useSelector(selectActiveAccount)
  const { getState } = useNavigation()
  const { formatCurrency } = useFormatCurrency()
  const [sourceAmount, setSourceAmount] = useOnRampSourceAmount()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [onrampToken] = useOnRampToken()
  const [serviceProvider, setServiceProvider] = useOnRampServiceProvider()
  const [paymentMethod, setPaymentMethod] = useOnRampPaymentMethod()
  const { data: purchaseLimits, isLoading: isLoadingPurchaseLimits } =
    useGetPurchaseLimits({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP],
      fiatCurrencies: [selectedCurrency],
      cryptoCurrencyCodes: onrampToken?.currencyCode
        ? [onrampToken?.currencyCode]
        : undefined
    })
  const { countryCode } = useLocale()
  const { getFromPopulatedNetwork } = useNetworks()
  const { getMarketTokenBySymbol } = useWatchlist()

  // debounce since fetching quotes can take awhile
  const debouncedSetAmount = useDebouncedCallback(
    setSourceAmount,
    DEFAULT_DEBOUNCE_MILLISECONDS
  )

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

  const { crytoQuotes, isLoadingCryptoQuotes, cryptoQuotesError } =
    useServiceProviders(
      isLoadingPurchaseLimits === false &&
        isBelowMaximumPurchaseLimit &&
        isAboveMinimumPurchaseLimit
    )

  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })

  const { data: defaultsByCountry, isLoading: isLoadingDefaultsByCountry } =
    useSearchDefaultsByCountry({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })

  const token = useMemo(() => {
    const t = filteredTokenList.find(
      tk => onrampToken && isTokenSupportedForBuying(onrampToken, tk)
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

  const redirectUrl = useMemo(() => {
    const state = getState()
    const currentIndex = state?.index
    const formattedAmount = formatCurrency({ amount: sourceAmount ?? 0 })
    return `core://${
      ACTIONS.OnrampCompleted
    }?amount=${formattedAmount}&dismissCount=${(currentIndex ?? 0) + 1}`
  }, [formatCurrency, getState, sourceAmount])

  const { data: onrampWidget } = useCreateSessionWidget({
    sessionType: SessionTypes.BUY,
    sessionData: {
      redirectUrl,
      sourceAmount: sourceAmount ?? 0,
      destinationCurrencyCode: onrampToken?.currencyCode ?? '',
      sourceCurrencyCode: selectedCurrency,
      walletAddress,
      serviceProvider
    }
  })

  const isBuyAllowed = useMemo(() => {
    return (
      (sourceAmount ?? 0) > 0 &&
      isBelowMaximumPurchaseLimit &&
      isAboveMinimumPurchaseLimit &&
      isLoadingCryptoQuotes === false &&
      cryptoQuotesError === undefined
    )
  }, [
    sourceAmount,
    isBelowMaximumPurchaseLimit,
    isAboveMinimumPurchaseLimit,
    isLoadingCryptoQuotes,
    cryptoQuotesError
  ])

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

  const defaultPaymentMethod = useMemo(() => {
    return defaultsByCountry?.find(d => d.countryCode === countryCode)
      ?.defaultPaymentMethods[0]
  }, [countryCode, defaultsByCountry])

  const paymentMethodToDisplay = useMemo(() => {
    return paymentMethod ? PaymentMethodNames[paymentMethod] : undefined
  }, [paymentMethod])

  const serviceProviderToDisplay = useMemo(() => {
    return serviceProvider ? ServiceProviderNames[serviceProvider] : undefined
  }, [serviceProvider])

  const formatInTokenUnit = useCallback(
    (amt: number): string => {
      if (token?.tokenWithBalance === undefined || amt === 0) {
        return ''
      }
      const currentPrice = getMarketTokenBySymbol(
        token.tokenWithBalance.symbol
      )?.currentPrice

      if (currentPrice === undefined) {
        return ''
      }
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

  const errorMessage = useMemo(() => {
    if (
      isAboveMinimumPurchaseLimit === false &&
      minimumPurchaseLimit &&
      sourceAmount !== 0
    ) {
      return `The minimum purchase amount is ${minimumPurchaseLimit} ${selectedCurrency}`
    }

    if (
      isBelowMaximumPurchaseLimit === false &&
      maximumPurchaseLimit &&
      sourceAmount !== 0
    ) {
      return `The maximum purchase amount is ${maximumPurchaseLimit} ${selectedCurrency}`
    }

    if (
      (cryptoQuotesError?.statusCode === CreateCryptoQuoteErrorCode.NOT_FOUND &&
        cryptoQuotesError.message.toLowerCase().includes('not found')) ||
      (cryptoQuotesError?.statusCode ===
        CreateCryptoQuoteErrorCode.INCOMPATIBLE_REQUEST &&
        cryptoQuotesError.message
          .toLowerCase()
          .includes('does not match service providers'))
    ) {
      return `${token?.tokenWithBalance.name} cannot be purchased at the moment, please try again later.`
    }

    if (cryptoQuotesError?.message) {
      return cryptoQuotesError.message
    }

    return undefined
  }, [
    isAboveMinimumPurchaseLimit,
    minimumPurchaseLimit,
    sourceAmount,
    isBelowMaximumPurchaseLimit,
    maximumPurchaseLimit,
    cryptoQuotesError,
    selectedCurrency,
    token?.tokenWithBalance.name
  ])

  return {
    formatInTokenUnit,
    sourceAmount,
    setSourceAmount: debouncedSetAmount,
    paymentMethodToDisplay,
    serviceProviderToDisplay,
    isBuyAllowed,
    token,
    tokenBalance,
    isAboveMinimumPurchaseLimit,
    isBelowMaximumPurchaseLimit,
    isLoadingDefaultsByCountry,
    isLoadingPurchaseLimits,
    widgetUrl: onrampWidget?.widgetUrl ?? undefined,
    isLoadingCryptoQuotes,
    errorMessage
  }
}
