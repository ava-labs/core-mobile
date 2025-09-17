import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useMemo } from 'react'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import { ServiceProviderCategories } from '../consts'
import { useMeldFiatAmount } from '../store'
import { useGetTradeLimits } from './useGetTradeLimits'
import { useMeldTokenWithBalance } from './useMeldTokenWithBalance'

export const useFiatSourceAmount = ({
  category
}: {
  category: ServiceProviderCategories
}): {
  sourceAmount: number | undefined
  cryptoSourceAmount: number | undefined
  setSourceAmount: (amount: number) => void
  isAboveMinimumLimit: boolean
  isBelowMaximumLimit: boolean
  minimumLimit: number | undefined
  maximumLimit: number | undefined
  isLoadingTradeLimits: boolean
  hasValidSourceAmount: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const [sourceAmount, setSourceAmount] = useMeldFiatAmount()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const token = useMeldTokenWithBalance({ category })
  const { data: tradeLimits, isLoading: isLoadingTradeLimits } =
    useGetTradeLimits({
      category,
      fiatCurrencies: [selectedCurrency],
      cryptoCurrencyCodes: token?.currencyCode
        ? [token?.currencyCode]
        : undefined
    })

  const currentTokenPrice = useMarketTokenBySymbol({
    symbol: token?.tokenWithBalance.symbol
  })?.currentPrice

  const currencyCode = useMemo(() => {
    return category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? selectedCurrency
      : token?.currencyCode
  }, [category, token?.currencyCode, selectedCurrency])

  const selectedTradeLimitCurrency = useMemo(() => {
    return tradeLimits?.find(limit => limit.currencyCode === currencyCode)
  }, [tradeLimits, currencyCode])

  const minimumLimit = useMemo(() => {
    if (category === ServiceProviderCategories.CRYPTO_ONRAMP) {
      return selectedTradeLimitCurrency?.minimumAmount ?? undefined
    }
    return selectedTradeLimitCurrency?.minimumAmount && currentTokenPrice
      ? selectedTradeLimitCurrency.minimumAmount * currentTokenPrice
      : undefined
  }, [category, selectedTradeLimitCurrency, currentTokenPrice])

  const maximumLimit = useMemo(() => {
    if (category === ServiceProviderCategories.CRYPTO_ONRAMP) {
      return selectedTradeLimitCurrency?.maximumAmount ?? undefined
    }
    return selectedTradeLimitCurrency?.maximumAmount && currentTokenPrice
      ? selectedTradeLimitCurrency.maximumAmount * currentTokenPrice
      : undefined
  }, [category, selectedTradeLimitCurrency?.maximumAmount, currentTokenPrice])

  const isAboveMinimumLimit = useMemo(() => {
    if (minimumLimit === undefined) {
      // if there is no minimum limit, we allow the user to proceed
      return true
    }

    return (sourceAmount ?? 0) >= (minimumLimit ?? 0)
  }, [minimumLimit, sourceAmount])

  const isBelowMaximumLimit = useMemo(() => {
    if (maximumLimit === undefined) {
      // if there is no maximum limit, we allow the user to proceed
      return true
    }

    return (sourceAmount ?? 0) <= (maximumLimit ?? 0)
  }, [maximumLimit, sourceAmount])

  const hasValidSourceAmount = useMemo(() => {
    return (
      sourceAmount !== undefined &&
      sourceAmount !== 0 &&
      isAboveMinimumLimit &&
      isBelowMaximumLimit
    )
  }, [sourceAmount, isAboveMinimumLimit, isBelowMaximumLimit])

  const cryptoSourceAmount = useMemo(() => {
    if (
      category === ServiceProviderCategories.CRYPTO_ONRAMP ||
      sourceAmount === undefined ||
      currentTokenPrice === undefined
    ) {
      return undefined
    }
    return sourceAmount / currentTokenPrice
  }, [category, sourceAmount, currentTokenPrice])

  return {
    cryptoSourceAmount,
    sourceAmount,
    setSourceAmount,
    hasValidSourceAmount,
    isAboveMinimumLimit,
    isBelowMaximumLimit,
    minimumLimit,
    maximumLimit,
    isLoadingTradeLimits
  }
}
