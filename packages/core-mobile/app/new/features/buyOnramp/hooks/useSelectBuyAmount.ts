import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LocalTokenWithBalance } from 'store/balance'
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
import { CryptoCurrency } from '../types'
import { isTokenSupportedForBuying } from '../utils'
import { useGetPurchaseLimits } from './useGetPurchaseLimits'
import { useLocale } from './useLocale'
import { useSearchDefaultsByCountry } from './useSearchDefaultsByCountry'

export const useSelectBuyAmount = (): {
  isLoadingDefaultsByCountry: boolean
  isLoadingPurchaseLimits: boolean
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
  minimumPurchaseLimit: number | undefined
  maximumPurchaseLimit: number | undefined
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
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

  const isBuyAllowed = useMemo(() => {
    return (
      (sourceAmount ?? 0) > 0 &&
      isBelowMaximumPurchaseLimit &&
      isAboveMinimumPurchaseLimit
    )
  }, [sourceAmount, isBelowMaximumPurchaseLimit, isAboveMinimumPurchaseLimit])

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

  useLayoutEffect(() => {
    setPaymentMethod(undefined)
    setServiceProvider(undefined)
  }, [setPaymentMethod, setServiceProvider])

  useEffect(() => {
    if (paymentMethod === undefined && defaultPaymentMethod) {
      setPaymentMethod(defaultPaymentMethod)
    }
  }, [defaultPaymentMethod, paymentMethod, setPaymentMethod])

  return {
    minimumPurchaseLimit,
    maximumPurchaseLimit,
    formatInTokenUnit,
    sourceAmount,
    setSourceAmount,
    paymentMethodToDisplay,
    serviceProviderToDisplay,
    isBuyAllowed,
    token,
    tokenBalance,
    isAboveMinimumPurchaseLimit,
    isBelowMaximumPurchaseLimit,
    isLoadingDefaultsByCountry,
    isLoadingPurchaseLimits
  }
}
